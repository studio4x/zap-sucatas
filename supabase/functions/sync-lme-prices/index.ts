/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { HttpError, requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog, insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type SyncMode = 'backfill' | 'latest'

type RawSnapshot = {
  currency_code: string
  metal_code: string
  metal_name: string
  price_value: number
  provider_name: string
  quoted_at: string
  source_payload: unknown
}

type PricingSyncRequestBody = {
  job_name?: string
  mode?: SyncMode
  trigger?: 'cron' | 'manual'
}

type SyncResolution = {
  entries: RawSnapshot[]
  warningMessage: string | null
}

type PricingSyncSecretRow = {
  cron_key: string
  job_name: string
}

const PRICING_SYNC_JOB_NAME = 'pricing_auto_sync'

const WESTMETALL_URL = 'https://www.westmetall.com/en/markdaten.php/en/en/markdaten.php'
const BCB_PTAX_PERIOD_URL =
  'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)'

const WESTMETALL_FIELD_MAP = new Map<string, { code: string; name: string }>([
  ['LME_Cu_cash', { code: 'CU', name: 'Cobre' }],
  ['LME_Zn_cash', { code: 'ZN', name: 'Zinco' }],
  ['LME_Al_cash', { code: 'AL', name: 'Aluminio' }],
  ['LME_Pb_cash', { code: 'PB', name: 'Chumbo' }],
  ['LME_Sn_cash', { code: 'SN', name: 'Estanho' }],
  ['LME_Ni_cash', { code: 'NI', name: 'Niquel' }],
])

const MONTH_MAP = new Map<string, string>([
  ['january', '01'],
  ['february', '02'],
  ['march', '03'],
  ['april', '04'],
  ['may', '05'],
  ['june', '06'],
  ['july', '07'],
  ['august', '08'],
  ['september', '09'],
  ['october', '10'],
  ['november', '11'],
  ['december', '12'],
])

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function parseNumericValue(input: string) {
  const sanitized = input.trim().replace(/\s/g, '')

  if (sanitized.length === 0) {
    return Number.NaN
  }

  if (sanitized.includes(',') && sanitized.includes('.')) {
    if (sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')) {
      return Number(sanitized.replace(/\./g, '').replace(',', '.'))
    }

    return Number(sanitized.replace(/,/g, ''))
  }

  if (sanitized.includes(',')) {
    return Number(sanitized.replace(/\./g, '').replace(',', '.'))
  }

  return Number(sanitized)
}

function toIsoMidday(quotedDate: string) {
  return `${quotedDate}T12:00:00.000Z`
}

function parseWestmetallDate(input: string) {
  const cleaned = normalizeWhitespace(input).replace(/\.$/, '')
  const match = cleaned.match(/^(\d{1,2})\.\s+([A-Za-z]+)\s+(\d{4})$/)

  if (!match) {
    throw new Error(`Não foi possível interpretar a data da Westmetall: ${input}`)
  }

  const [, day, monthName, year] = match
  const month = MONTH_MAP.get(monthName.toLowerCase())

  if (!month) {
    throw new Error(`Unsupported Westmetall month: ${monthName}`)
  }

  return `${year}-${month}-${day.padStart(2, '0')}`
}

function dedupeSnapshots(entries: RawSnapshot[]) {
  const map = new Map<string, RawSnapshot>()

  for (const entry of entries) {
    const quotedDate = entry.quoted_at.slice(0, 10)
    const key = `${entry.provider_name}:${entry.metal_code}:${entry.currency_code}:${quotedDate}`
    map.set(key, entry)
  }

  return Array.from(map.values()).sort((left, right) =>
    left.quoted_at < right.quoted_at ? 1 : left.quoted_at > right.quoted_at ? -1 : 0,
  )
}

function chunkArray<T>(entries: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < entries.length; index += size) {
    chunks.push(entries.slice(index, index + size))
  }

  return chunks
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'zap-sucatas-pricing-sync/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status} for ${url}`)
  }

  return response.text()
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'zap-sucatas-pricing-sync/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status} for ${url}`)
  }

  return (await response.json()) as T
}

async function fetchLatestWestmetallSnapshots() {
  const html = await fetchText(WESTMETALL_URL)
  const dateMatch = html.match(
    /<th class="text">Official LME-Prices in US Dollar<\/th>\s*<th class="number">([^<]+)<\/th>/i,
  )

  if (!dateMatch) {
    throw new Error('Não foi possível localizar a seção oficial da LME na Westmetall.')
  }

  const quotedDate = parseWestmetallDate(dateMatch[1])
  const sectionMatch = html.match(
    /Official LME-Prices in US Dollar[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i,
  )

  if (!sectionMatch) {
    throw new Error('Não foi possível interpretar o corpo da tabela da LME na Westmetall.')
  }

  const entries: RawSnapshot[] = []
  const rowRegex =
    /<tr>\s*<td>\s*<a href="[^"]*field=(LME_[A-Za-z]{2}_cash)[^"]*" class="block">\s*([^<]+?)\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/gi

  let match = rowRegex.exec(sectionMatch[1])

  while (match) {
    const [, field, label, value] = match
    const series = WESTMETALL_FIELD_MAP.get(field)

    if (series) {
      const numericValue = parseNumericValue(value)

      if (!Number.isNaN(numericValue)) {
        entries.push({
          currency_code: 'USD',
          metal_code: series.code,
          metal_name: series.name,
          price_value: numericValue,
          provider_name: 'westmetall',
          quoted_at: toIsoMidday(quotedDate),
          source_payload: {
            field,
            label: normalizeWhitespace(label),
            quoted_date: quotedDate,
            url: WESTMETALL_URL,
            value: normalizeWhitespace(value),
          },
        })
      }
    }

    match = rowRegex.exec(sectionMatch[1])
  }

  if (entries.length !== WESTMETALL_FIELD_MAP.size) {
    throw new Error(`Westmetall parser returned ${entries.length} rows; expected 6.`)
  }

  return entries
}

async function fetchWestmetallBackfillSnapshots() {
  const requests = Array.from(WESTMETALL_FIELD_MAP.entries()).map(async ([field, series]) => {
    const html = await fetchText(`${WESTMETALL_URL}?action=table&field=${field}`)
    const rowRegex =
      /<tr>\s*<td[^>]*>\s*(\d{1,2}\.\s+[A-Za-z]+\s+\d{4})\s*<\/td>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/gi
    const seriesEntries: RawSnapshot[] = []
    let match = rowRegex.exec(html)

    while (match) {
      const [, providerDate, value] = match
      const numericValue = parseNumericValue(value)

      if (!Number.isNaN(numericValue)) {
        const quotedDate = parseWestmetallDate(providerDate)

        seriesEntries.push({
          currency_code: 'USD',
          metal_code: series.code,
          metal_name: series.name,
          price_value: numericValue,
          provider_name: 'westmetall',
          quoted_at: toIsoMidday(quotedDate),
          source_payload: {
            field,
            quoted_date: quotedDate,
            url: `${WESTMETALL_URL}?action=table&field=${field}`,
            value: normalizeWhitespace(value),
          },
        })
      }

      match = rowRegex.exec(html)
    }

    return seriesEntries
  })

  const seriesEntries = await Promise.all(requests)

  return dedupeSnapshots(seriesEntries.flat())
}

type BcbPtaxPeriodResponse = {
  value?: Array<{
    cotacaoCompra?: number
    cotacaoVenda?: number
    dataHoraCotacao?: string
  }>
}

function formatBcbDate(value: Date) {
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  const year = String(value.getUTCFullYear())
  return `${month}-${day}-${year}`
}

async function fetchBcbUsdPeriodSnapshots(range: { daysBack: number }) {
  const end = new Date()
  const start = new Date()
  start.setUTCDate(end.getUTCDate() - range.daysBack)
  const url =
    `${BCB_PTAX_PERIOD_URL}?@dataInicial='${formatBcbDate(start)}'` +
    `&@dataFinalCotacao='${formatBcbDate(end)}'&$top=10000&$format=json`
  const payload = await fetchJson<BcbPtaxPeriodResponse>(url)
  const entries = (payload.value ?? [])
    .map((entry) => {
      const quotedAt = entry.dataHoraCotacao
        ? new Date(entry.dataHoraCotacao.replace(' ', 'T') + 'Z').toISOString()
        : null
      const quotedDate = quotedAt?.slice(0, 10) ?? null
      const value = typeof entry.cotacaoVenda === 'number' ? entry.cotacaoVenda : null

      if (!quotedAt || !quotedDate || value === null) {
        return null
      }

      return {
        currency_code: 'BRL',
        metal_code: 'USD',
        metal_name: 'Dolar',
        price_value: value,
        provider_name: 'bcb_ptax',
        quoted_at: quotedAt,
        source_payload: entry,
      } satisfies RawSnapshot
    })
    .filter((entry): entry is RawSnapshot => entry !== null)

  if (entries.length === 0) {
    throw new Error('Banco Central PTAX did not return any USD/BRL snapshots.')
  }

  return dedupeSnapshots(entries)
}

async function fetchLatestUsdSnapshot() {
  const entries = await fetchBcbUsdPeriodSnapshots({ daysBack: 7 })
  const latest = entries.sort((left, right) =>
    left.quoted_at < right.quoted_at ? 1 : left.quoted_at > right.quoted_at ? -1 : 0,
  )[0]

  if (!latest) {
    throw new Error('Não foi possível resolver o último snapshot da PTAX USD/BRL.')
  }

  return latest
}

async function fetchUsdBackfillSnapshots() {
  return fetchBcbUsdPeriodSnapshots({ daysBack: 365 })
}

async function resolveSnapshots(mode: SyncMode) {
  if (mode === 'backfill') {
    const [metalSnapshots, usdSnapshots] = await Promise.all([
      fetchWestmetallBackfillSnapshots(),
      fetchUsdBackfillSnapshots(),
    ])

    return {
      entries: dedupeSnapshots([...metalSnapshots, ...usdSnapshots]),
      warningMessage: null,
    } satisfies SyncResolution
  }

  const usdSnapshot = await fetchLatestUsdSnapshot()

  try {
    const metalSnapshots = await fetchLatestWestmetallSnapshots()

    return {
      entries: dedupeSnapshots([...metalSnapshots, usdSnapshot]),
      warningMessage: null,
    } satisfies SyncResolution
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // Westmetall can temporarily return placeholders ("-") before publishing values.
    if (message.includes('Westmetall parser returned 0 rows')) {
      return {
        entries: dedupeSnapshots([usdSnapshot]),
        warningMessage:
          'Westmetall sem cotações numericas no momento; sincronizacao parcial concluida (apenas dolar).',
      } satisfies SyncResolution
    }

    throw error
  }
}

function resolveMode(requestBody: unknown): SyncMode {
  if (
    requestBody &&
    typeof requestBody === 'object' &&
    'mode' in requestBody &&
    (requestBody as { mode?: string }).mode === 'backfill'
  ) {
    return 'backfill'
  }

  return 'latest'
}

async function validatePricingSyncAccess(request: Request) {
  const admin = createAdminClient()
  const body = (await request.clone().json().catch(() => ({}))) as PricingSyncRequestBody
  const cronKey = request.headers.get('x-cron-key')

  if (cronKey) {
    const { data, error } = await admin
      .from('pricing_sync_secrets')
      .select('job_name, cron_key')
      .eq('job_name', PRICING_SYNC_JOB_NAME)
      .maybeSingle()

    if (error) {
      throw error
    }

    const secretRow = data as PricingSyncSecretRow | null

    if (!secretRow || secretRow.cron_key !== cronKey) {
      throw new HttpError('token ausente ou invalido', 401)
    }

    return {
      actorUserId: null as string | null,
      accessSource: 'cron' as const,
      body,
      admin,
    }
  }

  const actor = await requireAdminProfile(request)

  return {
    actorUserId: actor.id,
    accessSource: 'manual' as const,
    body,
    admin,
  }
}

async function updatePricingSyncStatus(
  admin: ReturnType<typeof createAdminClient>,
  patch: {
    lastMessage?: string | null
    lastRunAt?: string | null
    lastSnapshotCount?: number
    lastStatus?: 'error' | 'never' | 'queued' | 'running' | 'success' | 'warning'
    lastSuccessAt?: string | null
    lastTriggeredAt?: string | null
  },
) {
  const { error } = await admin
    .from('pricing_sync_status')
    .update({
      last_message: patch.lastMessage,
      last_run_at: patch.lastRunAt,
      last_snapshot_count: patch.lastSnapshotCount,
      last_status: patch.lastStatus,
      last_success_at: patch.lastSuccessAt,
      last_triggered_at: patch.lastTriggeredAt,
      updated_at: new Date().toISOString(),
    })
    .eq('job_name', PRICING_SYNC_JOB_NAME)

  if (error) {
    throw error
  }
}

Deno.serve(async (request) => {
  let requestBody: Record<string, unknown> = {}
  let accessSource: 'cron' | 'manual' | null = null
  let actorUserId: string | null = null
  let admin = createAdminClient()

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405)
    }

    const access = await validatePricingSyncAccess(request)
    accessSource = access.accessSource
    actorUserId = access.actorUserId
    admin = access.admin
    requestBody = access.body as Record<string, unknown>
    const mode = resolveMode(requestBody)
    await updatePricingSyncStatus(admin, {
      lastMessage:
        accessSource === 'cron'
          ? 'Sincronizacao automática em andamento.'
          : 'Sincronizacao manual em andamento.',
      lastRunAt: new Date().toISOString(),
      lastStatus: 'running',
      lastTriggeredAt: new Date().toISOString(),
    })
    const resolution = await resolveSnapshots(mode)
    const entries = resolution.entries
    const chunks = chunkArray(entries, 500)

    for (const chunk of chunks) {
      const { error: upsertError } = await admin.from('lme_price_snapshots').upsert(chunk, {
        onConflict: 'metal_code,quoted_date,currency_code,provider_name',
      })

      if (upsertError) {
        throw upsertError
      }
    }

    await insertIntegrationLog({
      integrationName: 'lme',
      message:
        resolution.warningMessage ??
        `Pricing sync completed in ${mode} mode with ${entries.length} snapshots.`,
      payload: {
        actor_profile_id: actorUserId,
        count: entries.length,
        event: 'pricing_sync_completed',
        mode,
        source: accessSource,
        warning: resolution.warningMessage,
        providers: Array.from(new Set(entries.map((entry) => entry.provider_name))),
        severity: resolution.warningMessage ? 'warning' : 'success',
      },
      status: resolution.warningMessage ? 'warning' : 'success',
    })

    await insertAdminAuditLog({
      action: 'sync_lme_prices',
      actorUserId,
      afterData: {
        count: entries.length,
        mode,
        source: accessSource,
        providers: Array.from(new Set(entries.map((entry) => entry.provider_name))),
      },
      entityType: 'pricing',
    })

    await updatePricingSyncStatus(admin, {
      lastMessage: resolution.warningMessage
        ? resolution.warningMessage
        : accessSource === 'cron'
          ? `Sincronizacao automática concluida com ${entries.length} snapshots.`
          : `Sincronizacao manual concluida com ${entries.length} snapshots.`,
      lastRunAt: new Date().toISOString(),
      lastSnapshotCount: entries.length,
      lastStatus: resolution.warningMessage ? 'warning' : 'success',
      lastSuccessAt: new Date().toISOString(),
      lastTriggeredAt: new Date().toISOString(),
    })

    return jsonResponse({
      inserted: entries.length,
      mode,
      providers: Array.from(new Set(entries.map((entry) => entry.provider_name))),
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected pricing sync error.'

    if (accessSource) {
      await updatePricingSyncStatus(admin, {
        lastMessage: message,
        lastRunAt: new Date().toISOString(),
        lastStatus: 'error',
        lastTriggeredAt: new Date().toISOString(),
      }).catch(() => null)
    }

    await insertIntegrationLog({
      integrationName: 'lme',
      message,
      payload: {
        event: 'pricing_sync_failed',
        mode: typeof requestBody['mode'] === 'string' ? requestBody['mode'] : 'latest',
        severity: 'danger',
      },
      status: 'error',
    })

    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

