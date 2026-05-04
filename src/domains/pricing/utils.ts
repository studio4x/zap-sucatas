import type {
  LmePriceSnapshot,
  PricingChartSeries,
  PricingPageData,
  PricingSeriesCode,
  PricingTableRow,
} from '@/domains/pricing/types'

export const pricingSeriesCatalog: Array<{
  code: PricingSeriesCode
  color: string
  currencyCode: 'BRL' | 'USD'
  label: string
}> = [
  { code: 'CU', color: '#218c4f', currencyCode: 'USD', label: 'Cobre' },
  { code: 'ZN', color: '#3fa34d', currencyCode: 'USD', label: 'Zinco' },
  { code: 'AL', color: '#0e7490', currencyCode: 'USD', label: 'Alumínio' },
  { code: 'PB', color: '#8b5cf6', currencyCode: 'USD', label: 'Chumbo' },
  { code: 'SN', color: '#ca8a04', currencyCode: 'USD', label: 'Estanho' },
  { code: 'NI', color: '#ef4444', currencyCode: 'USD', label: 'Níquel' },
  { code: 'USD', color: '#2563eb', currencyCode: 'BRL', label: 'Dólar' },
]

const pricingSeriesLookup = new Map(pricingSeriesCatalog.map((series) => [series.code, series]))

type DailySnapshotRow = {
  quotedDate: string
  values: Partial<Record<PricingSeriesCode, number>>
}

export function formatPricingNumber(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatPricingDate(date: string | null) {
  if (!date) {
    return 'Não informado'
  }

  const parsed = new Date(`${date}T12:00:00`)

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

export function formatPricingDateTime(dateTime: string | null) {
  if (!dateTime) {
    return 'Não informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateTime))
}

export function formatMonthLabel(monthStart: string) {
  const parsed = new Date(`${monthStart}T12:00:00`)
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parsed)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function getMonthStart(quotedDate: string) {
  const [year, month] = quotedDate.split('-')
  return `${year}-${month}-01`
}

export function addDays(quotedDate: string, amount: number) {
  const [year, month, day] = quotedDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function subtractMonths(quotedDate: string, amount: number) {
  const [year, month, day] = quotedDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCMonth(date.getUTCMonth() - amount)
  return date.toISOString().slice(0, 10)
}

export function getIsoWeekParts(quotedDate: string) {
  const [year, month, day] = quotedDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayNumber = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNumber + 3)
  const isoYear = date.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3)
  const diff = date.getTime() - firstThursday.getTime()
  const isoWeek = 1 + Math.round(diff / 604800000)

  return { isoWeek, isoYear }
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, current) => sum + current, 0) / values.length
}

function buildDailyRows(snapshots: LmePriceSnapshot[]) {
  const map = new Map<string, DailySnapshotRow>()

  for (const snapshot of snapshots) {
    const current =
      map.get(snapshot.quotedDate) ??
      ({
        quotedDate: snapshot.quotedDate,
        values: {},
      } satisfies DailySnapshotRow)

    current.values[snapshot.metalCode] = snapshot.priceValue
    map.set(snapshot.quotedDate, current)
  }

  return Array.from(map.values()).sort((left, right) =>
    left.quotedDate < right.quotedDate ? 1 : left.quotedDate > right.quotedDate ? -1 : 0,
  )
}

function buildWeeklyAverageRow(rows: DailySnapshotRow[], isoWeek: number, isoYear: number): PricingTableRow {
  const values = pricingSeriesCatalog.reduce<Partial<Record<PricingSeriesCode, number>>>(
    (accumulator, series) => {
      const collected = rows
        .map((row) => row.values[series.code])
        .filter((value): value is number => typeof value === 'number')
      const result = average(collected)

      if (typeof result === 'number') {
        accumulator[series.code] = result
      }

      return accumulator
    },
    {},
  )

  return {
    label: 'Média da semana',
    quotedDate: null,
    monthKey: null,
    rowType: 'weekly_average',
    values,
    weekLabel: `${isoWeek} / ${isoYear}`,
  }
}

function buildMonthlyAverageRow(rows: DailySnapshotRow[], monthKey: string): PricingTableRow | null {
  const values = pricingSeriesCatalog.reduce<Partial<Record<PricingSeriesCode, number>>>(
    (accumulator, series) => {
      const collected = rows
        .map((row) => row.values[series.code])
        .filter((value): value is number => typeof value === 'number')
      const result = average(collected)

      if (typeof result === 'number') {
        accumulator[series.code] = result
      }

      return accumulator
    },
    {},
  )

  if (Object.keys(values).length === 0) {
    return null
  }

  return {
    label: 'Média do mês',
    monthKey,
    quotedDate: null,
    rowType: 'monthly_average',
    values,
    weekLabel: null,
  }
}

function buildPeriodAverageRow(rows: DailySnapshotRow[]): PricingTableRow | null {
  const values = pricingSeriesCatalog.reduce<Partial<Record<PricingSeriesCode, number>>>(
    (accumulator, series) => {
      const collected = rows
        .map((row) => row.values[series.code])
        .filter((value): value is number => typeof value === 'number')
      const result = average(collected)

      if (typeof result === 'number') {
        accumulator[series.code] = result
      }

      return accumulator
    },
    {},
  )

  if (Object.keys(values).length === 0) {
    return null
  }

  return {
    label: 'Média do período',
    monthKey: null,
    quotedDate: null,
    rowType: 'period_average',
    values,
    weekLabel: null,
  }
}

export function buildPricingHistoryRows(snapshots: LmePriceSnapshot[]) {
  const rows = buildDailyRows(snapshots)

  if (rows.length === 0) {
    return [] as PricingTableRow[]
  }

  const byMonth = new Map<string, DailySnapshotRow[]>()

  for (const row of rows) {
    const key = getMonthStart(row.quotedDate)
    const monthRows = byMonth.get(key) ?? []
    monthRows.push(row)
    byMonth.set(key, monthRows)
  }

  const historyRows: PricingTableRow[] = []
  const orderedMonths = Array.from(byMonth.entries()).sort(([left], [right]) =>
    left < right ? 1 : left > right ? -1 : 0,
  )

  for (const [monthKey, monthRows] of orderedMonths) {
    const byWeek = new Map<string, DailySnapshotRow[]>()

    for (const row of monthRows) {
      const { isoWeek, isoYear } = getIsoWeekParts(row.quotedDate)
      const key = `${isoYear}-${String(isoWeek).padStart(2, '0')}`
      const weekRows = byWeek.get(key) ?? []
      weekRows.push(row)
      byWeek.set(key, weekRows)
    }

    const orderedWeeks = Array.from(byWeek.entries()).sort(([left], [right]) =>
      left < right ? 1 : left > right ? -1 : 0,
    )

    for (const [key, weekRows] of orderedWeeks) {
      const [isoYear, isoWeekString] = key.split('-')
      const isoWeek = Number(isoWeekString)

      for (const row of weekRows.sort((left, right) =>
        left.quotedDate < right.quotedDate ? 1 : left.quotedDate > right.quotedDate ? -1 : 0,
      )) {
        historyRows.push({
          label: formatPricingDate(row.quotedDate),
          monthKey: null,
          quotedDate: row.quotedDate,
          rowType: 'daily',
          values: row.values,
          weekLabel: null,
        })
      }

      historyRows.push(buildWeeklyAverageRow(weekRows, isoWeek, Number(isoYear)))
    }

    const monthlyAverage = buildMonthlyAverageRow(monthRows, monthKey)

    if (monthlyAverage) {
      historyRows.push(monthlyAverage)
    }
  }

  const periodAverage = buildPeriodAverageRow(rows)

  if (periodAverage) {
    historyRows.push(periodAverage)
  }

  return historyRows
}

export function buildPricingChartSeries(snapshots: LmePriceSnapshot[]) {
  const rows = buildDailyRows(snapshots).sort((left, right) =>
    left.quotedDate > right.quotedDate ? 1 : left.quotedDate < right.quotedDate ? -1 : 0,
  )

  return pricingSeriesCatalog.reduce<PricingChartSeries[]>((accumulator, series) => {
    const points = rows
      .map((row) => {
        const value = row.values[series.code]

        if (typeof value !== 'number') {
          return null
        }

        return {
          quotedDate: row.quotedDate,
          value,
        }
      })
      .filter((point): point is { quotedDate: string; value: number } => point !== null)

    if (points.length > 0) {
      accumulator.push({
        code: series.code,
        color: series.color,
        label: series.label,
        points,
      })
    }

    return accumulator
  }, [])
}

export function buildPricingPageModel(input: {
  chartSnapshots: LmePriceSnapshot[]
  historySnapshots: LmePriceSnapshot[]
  historyWindowLabel: string
  lastManualUpdate: string | null
  manualEntries: PricingPageData['manualEntries']
  chartWindowLabel: string
}): Omit<PricingPageData, 'manualEntries'> {
  const historyRows = buildPricingHistoryRows(input.historySnapshots)
  const chartSeries = buildPricingChartSeries(input.chartSnapshots)
  const latestSnapshot = [...input.historySnapshots].sort((left, right) =>
    left.quotedDate < right.quotedDate ? 1 : left.quotedDate > right.quotedDate ? -1 : 0,
  )[0]

  const latestValues =
    latestSnapshot === undefined
      ? {}
      : input.historySnapshots
          .filter((snapshot) => snapshot.quotedDate === latestSnapshot.quotedDate)
          .reduce<Partial<Record<PricingSeriesCode, number>>>((accumulator, snapshot) => {
            accumulator[snapshot.metalCode] = snapshot.priceValue
            return accumulator
          }, {})

  return {
    chartSeries,
    chartSnapshotCount: input.chartSnapshots.length,
    chartWindowLabel: input.chartWindowLabel,
    historyRows,
    historySnapshotCount: input.historySnapshots.length,
    historyWindowLabel: input.historyWindowLabel,
    lastManualUpdate: input.lastManualUpdate,
    latestQuotedDate: latestSnapshot?.quotedDate ?? null,
    latestValues,
  }
}

export function parsePricingNumberInput(value: string) {
  const sanitized = value.trim()

  if (sanitized.length === 0) {
    return null
  }

  const normalized = sanitized.includes(',')
    ? sanitized.replace(/\./g, '').replace(',', '.')
    : sanitized

  const parsed = Number(normalized)

  return Number.isNaN(parsed) ? null : parsed
}

export function getSeriesLabel(code: PricingSeriesCode) {
  return pricingSeriesLookup.get(code)?.label ?? code
}

export function getSeriesCurrency(code: PricingSeriesCode) {
  return pricingSeriesLookup.get(code)?.currencyCode ?? 'USD'
}
