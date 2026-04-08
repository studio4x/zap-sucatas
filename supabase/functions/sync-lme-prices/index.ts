/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
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

const WESTMETALL_URL = 'https://www.westmetall.com/en/markdaten.php/en/en/markdaten.php'
const AWESOME_API_USD_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL'
const AWESOME_API_USD_DAILY_URL = 'https://economia.awesomeapi.com.br/json/daily/USD-BRL/365'

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

function stripHtml(html: string) {
  return normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&amp;/gi, '&'),
  )
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
    throw new Error(`Unable to parse Westmetall date: ${input}`)
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
    throw new Error('Unable to find the official LME section in Westmetall.')
  }

  const quotedDate = parseWestmetallDate(dateMatch[1])
  const sectionMatch = html.match(
    /Official LME-Prices in US Dollar[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i,
  )

  if (!sectionMatch) {
    throw new Error('Unable to parse the Westmetall LME table body.')
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

type AwesomeUsdResponse = {
  USDBRL?: {
    bid?: string
    create_date?: string
    timestamp?: string
  }
}

type AwesomeUsdDailyEntry = {
  bid?: string
  create_date?: string
  timestamp?: string
}

async function fetchLatestUsdSnapshot() {
  const payload = await fetchJson<AwesomeUsdResponse>(AWESOME_API_USD_URL)
  const usd = payload.USDBRL
  const value = parseNumericValue(String(usd?.bid ?? ''))

  if (!usd || Number.isNaN(value)) {
    throw new Error('Unable to parse the USD/BRL payload from AwesomeAPI.')
  }

  const quotedDate = usd.create_date ? usd.create_date.slice(0, 10) : new Date().toISOString().slice(0, 10)

  return {
    currency_code: 'BRL',
    metal_code: 'USD',
    metal_name: 'Dolar',
    price_value: value,
    provider_name: 'awesomeapi',
    quoted_at: usd.create_date
      ? new Date(usd.create_date.replace(' ', 'T') + 'Z').toISOString()
      : toIsoMidday(quotedDate),
    source_payload: payload,
  } satisfies RawSnapshot
}

async function fetchUsdBackfillSnapshots() {
  const payload = await fetchJson<AwesomeUsdDailyEntry[]>(AWESOME_API_USD_DAILY_URL)
  const entries = payload
    .map((entry) => {
      const priceValue = parseNumericValue(String(entry.bid ?? ''))
      const quotedDate = entry.create_date ? entry.create_date.slice(0, 10) : null

      if (Number.isNaN(priceValue) || !quotedDate) {
        return null
      }

      return {
        currency_code: 'BRL',
        metal_code: 'USD',
        metal_name: 'Dolar',
        price_value: priceValue,
        provider_name: 'awesomeapi',
        quoted_at: entry.create_date
          ? new Date(entry.create_date.replace(' ', 'T') + 'Z').toISOString()
          : toIsoMidday(quotedDate),
        source_payload: entry,
      } satisfies RawSnapshot
    })
    .filter((entry): entry is RawSnapshot => entry !== null)

  if (entries.length === 0) {
    throw new Error('Unable to build USD backfill snapshots from AwesomeAPI.')
  }

  return dedupeSnapshots(entries)
}

async function resolveSnapshots(mode: SyncMode) {
  if (mode === 'backfill') {
    const [metalSnapshots, usdSnapshots] = await Promise.all([
      fetchWestmetallBackfillSnapshots(),
      fetchUsdBackfillSnapshots(),
    ])

    return dedupeSnapshots([...metalSnapshots, ...usdSnapshots])
  }

  const [metalSnapshots, usdSnapshot] = await Promise.all([
    fetchLatestWestmetallSnapshots(),
    fetchLatestUsdSnapshot(),
  ])

  return dedupeSnapshots([...metalSnapshots, usdSnapshot])
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405)
    }

    const actor = await requireAdminProfile(request)
    const body = await request.json().catch(() => ({}))
    const mode = resolveMode(body)
    const entries = await resolveSnapshots(mode)
    const admin = createAdminClient()
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
      message: `Pricing sync completed in ${mode} mode with ${entries.length} snapshots.`,
      payload: {
        actor_profile_id: actor.id,
        count: entries.length,
        mode,
        providers: Array.from(new Set(entries.map((entry) => entry.provider_name))),
      },
      status: 'success',
    })

    return jsonResponse({
      inserted: entries.length,
      mode,
      providers: Array.from(new Set(entries.map((entry) => entry.provider_name))),
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected pricing sync error.'

    await insertIntegrationLog({
      integrationName: 'lme',
      message,
      status: 'error',
    })

    return jsonResponse({ error: message }, 500)
  }
})
