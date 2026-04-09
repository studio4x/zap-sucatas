import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type {
  LmePriceSnapshot,
  PricingAdminDashboard,
  PricingPageData,
  PricingSeriesCode,
  PricingSyncMode,
  PricingSyncResult,
  SaveManualLmeSnapshotsInput,
  ScrapPriceEntry,
  UpsertScrapPriceEntryInput,
} from '@/domains/pricing/types'
import {
  addDays,
  buildPricingPageModel,
  parsePricingNumberInput,
  subtractMonths,
} from '@/domains/pricing/utils'

type ScrapPriceEntryRow = {
  created_at: string
  effective_date: string
  id: string
  is_active: boolean
  material_name: string
  price_label: string
  price_numeric: number | null
  price_unit: string | null
  region_name: string | null
  source_type: string
  updated_at: string
}

type LmePriceSnapshotRow = {
  created_at: string
  currency_code: string
  id: string
  metal_code: LmePriceSnapshot['metalCode']
  metal_name: string
  price_value: number
  provider_name: string
  quoted_at: string
  quoted_date: string
  source_payload: unknown
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessao invalida. Faca login novamente.')
    }

    return session.access_token
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token ?? session.access_token

  if (!accessToken) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  return accessToken
}

async function invokePricingFunction<TBody extends object, TResponse>(name: string, body: TBody) {
  ensureSupabase()

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  const accessToken = await getFreshAccessToken()
  const response = await fetch(`${env.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({
      ...body,
      access_token: accessToken,
    }),
  })

  if (!response.ok) {
    try {
      const payload = (await response.json()) as { error?: string }

      if (payload.error) {
        throw new Error(payload.error)
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) {
        throw parseError
      }
    }

    throw new Error('Edge Function returned a non-2xx status code')
  }

  return (await response.json()) as TResponse
}

function mapScrapPriceEntry(row: ScrapPriceEntryRow): ScrapPriceEntry {
  return {
    createdAt: row.created_at,
    effectiveDate: row.effective_date,
    id: row.id,
    isActive: row.is_active,
    materialName: row.material_name,
    priceLabel: row.price_label,
    priceNumeric: row.price_numeric,
    priceUnit: row.price_unit,
    regionName: row.region_name,
    sourceType: row.source_type,
    updatedAt: row.updated_at,
  }
}

function mapSnapshot(row: LmePriceSnapshotRow): LmePriceSnapshot {
  return {
    createdAt: row.created_at,
    currencyCode: row.currency_code,
    id: row.id,
    metalCode: row.metal_code,
    metalName: row.metal_name,
    priceValue: row.price_value,
    providerName: row.provider_name,
    quotedAt: row.quoted_at,
    quotedDate: row.quoted_date,
    sourcePayload: row.source_payload,
  }
}

async function fetchLatestQuotedDate() {
  const { data, error } = await ensureSupabase()
    .from('lme_price_snapshots')
    .select('quoted_date')
    .order('quoted_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.quoted_date ?? null
}

async function fetchSnapshotsRange(range: { startDate: string | null; endDate: string | null }) {
  if (!range.startDate || !range.endDate) {
    return {
      snapshots: [] as LmePriceSnapshot[],
    }
  }

  const { data, error } = await ensureSupabase()
    .from('lme_price_snapshots')
    .select(
      'id, metal_code, metal_name, currency_code, price_value, quoted_at, quoted_date, provider_name, source_payload, created_at',
    )
    .gte('quoted_date', range.startDate)
    .lte('quoted_date', range.endDate)
    .order('quoted_date', { ascending: false })

  if (error) {
    throw error
  }

  return {
    snapshots: (data ?? []).map((row) => mapSnapshot(row as unknown as LmePriceSnapshotRow)),
  }
}

function getLastManualUpdate(entries: ScrapPriceEntry[]) {
  return [...entries]
    .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : left.updatedAt > right.updatedAt ? -1 : 0))[0]
    ?.updatedAt ?? null
}

async function buildPricingDashboardData(
  manualEntries: ScrapPriceEntry[],
  latestQuotedDate: string | null,
) {
  const historyStartDate = latestQuotedDate ? subtractMonths(latestQuotedDate, 6) : null
  const chartStartDate = latestQuotedDate ? addDays(latestQuotedDate, -29) : null

  const [historyResponse, chartResponse] = await Promise.all([
    fetchSnapshotsRange({
      endDate: latestQuotedDate,
      startDate: historyStartDate,
    }),
    fetchSnapshotsRange({
      endDate: latestQuotedDate,
      startDate: chartStartDate,
    }),
  ])

  return buildPricingPageModel({
    chartSnapshots: chartResponse.snapshots,
    chartWindowLabel: 'Ultimos 30 dias',
    historySnapshots: historyResponse.snapshots,
    historyWindowLabel: 'Ultimos 6 meses',
    lastManualUpdate: getLastManualUpdate(manualEntries),
    manualEntries,
  })
}

export async function fetchPublicPricingPageData(): Promise<PricingPageData> {
  const [manualResponse, latestQuotedDate] = await Promise.all([
    ensureSupabase()
      .from('scrap_price_entries')
      .select(
        'id, material_name, region_name, price_label, price_numeric, price_unit, source_type, effective_date, is_active, created_at, updated_at',
      )
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .order('material_name', { ascending: true }),
    fetchLatestQuotedDate(),
  ])

  if (manualResponse.error) {
    throw manualResponse.error
  }

  const manualEntries = (manualResponse.data ?? []).map((row) =>
    mapScrapPriceEntry(row as unknown as ScrapPriceEntryRow),
  )

  const model = await buildPricingDashboardData(manualEntries, latestQuotedDate)

  return {
    manualEntries,
    ...model,
  }
}

export async function fetchAdminPricingDashboard(): Promise<PricingAdminDashboard> {
  const [manualResponse, recentResponse, latestQuotedDate] = await Promise.all([
    ensureSupabase()
      .from('scrap_price_entries')
      .select(
        'id, material_name, region_name, price_label, price_numeric, price_unit, source_type, effective_date, is_active, created_at, updated_at',
      )
      .order('effective_date', { ascending: false })
      .order('updated_at', { ascending: false }),
    ensureSupabase()
      .from('lme_price_snapshots')
      .select(
        'id, metal_code, metal_name, currency_code, price_value, quoted_at, quoted_date, provider_name, source_payload, created_at',
      )
      .order('quoted_date', { ascending: false })
      .limit(70),
    fetchLatestQuotedDate(),
  ])

  if (manualResponse.error) {
    throw manualResponse.error
  }

  if (recentResponse.error) {
    throw recentResponse.error
  }

  const manualEntries = (manualResponse.data ?? []).map((row) =>
    mapScrapPriceEntry(row as unknown as ScrapPriceEntryRow),
  )
  const recentSnapshots = (recentResponse.data ?? []).map((row) =>
    mapSnapshot(row as unknown as LmePriceSnapshotRow),
  )
  const model = await buildPricingDashboardData(manualEntries, latestQuotedDate)

  return {
    manualEntries,
    recentSnapshots,
    ...model,
  }
}

export async function upsertScrapPriceEntry(input: UpsertScrapPriceEntryInput) {
  const payload = {
    effective_date: input.effectiveDate,
    is_active: input.isActive,
    material_name: input.materialName.trim(),
    price_label: input.priceLabel.trim(),
    price_numeric: parsePricingNumberInput(input.priceNumeric),
    price_unit: input.priceUnit.trim() || null,
    region_name: input.regionName.trim() || null,
    source_type: 'manual',
  }

  const query = input.id
    ? ensureSupabase().from('scrap_price_entries').update(payload).eq('id', input.id)
    : ensureSupabase().from('scrap_price_entries').insert(payload)

  const { data, error } = await query
    .select(
      'id, material_name, region_name, price_label, price_numeric, price_unit, source_type, effective_date, is_active, created_at, updated_at',
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Falha ao salvar a entrada manual de preco.')
  }

  return mapScrapPriceEntry(data as unknown as ScrapPriceEntryRow)
}

export async function deleteScrapPriceEntry(id: string) {
  const { error } = await ensureSupabase().from('scrap_price_entries').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export async function saveManualLmeSnapshots(input: SaveManualLmeSnapshotsInput) {
  const rows = (Object.entries(input.values) as Array<[PricingSeriesCode, string]>)
    .map(([code, rawValue]) => {
      const numericValue = parsePricingNumberInput(rawValue)

      if (numericValue === null) {
        return null
      }

      return {
        currency_code: code === 'USD' ? 'BRL' : 'USD',
        metal_code: code,
        metal_name:
          {
            AL: 'Aluminio',
            CU: 'Cobre',
            NI: 'Niquel',
            PB: 'Chumbo',
            SN: 'Estanho',
            USD: 'Dolar',
            ZN: 'Zinco',
          }[code] ?? code,
        price_value: numericValue,
        provider_name: input.providerName?.trim() || 'manual_admin',
        quoted_at: `${input.quotedDate}T12:00:00.000Z`,
        source_payload: {
          source: 'admin_manual_form',
        },
      }
    })
    .filter((row) => row !== null)

  if (rows.length === 0) {
    throw new Error('Informe pelo menos um valor manual para registrar a cotacao.')
  }

  const { error } = await ensureSupabase().from('lme_price_snapshots').upsert(rows, {
    onConflict: 'metal_code,quoted_date,currency_code,provider_name',
  })

  if (error) {
    throw error
  }
}

export async function runPricingSync(mode: PricingSyncMode) {
  return invokePricingFunction<{ mode: PricingSyncMode }, PricingSyncResult>('sync-lme-prices', {
    mode,
  })
}
