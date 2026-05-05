import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PricingSeriesCode, PricingTableRow } from '@/domains/pricing/types'
import {
  formatMonthLabel,
  formatPricingDate,
  formatPricingNumber,
  getIsoWeekParts,
  getSeriesLabel,
  pricingSeriesCatalog,
} from '@/domains/pricing/utils'

type MonthlyIndicatorRow = PricingTableRow & {
  monthKey: string
  rowType: 'monthly_average'
}

type TrendPoint = {
  label: string
  value: number
}

type TrendSummary = {
  currentLabel: string
  currentValue: number | null
  previousLabel: string
  previousValue: number | null
  points: TrendPoint[]
  title: string
}

type MiniTrendChartProps = {
  color: string
  points: TrendPoint[]
}

type ContrastPalette = {
  strongText: string
  mutedText: string
  softSurface: string
  border: string
  chipSurface: string
}

function getSeriesUnitLabel(seriesCode: PricingSeriesCode) {
  return seriesCode === 'USD' ? 'Dólar: BRL por USD' : 'Metais LME: USD por tonelada'
}

function hexToRgb(hexColor: string) {
  const normalized = hexColor.replace('#', '')
  const hex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized
  const parsed = Number.parseInt(hex, 16)

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  }
}

function getContrastPalette(hexColor: string): ContrastPalette {
  const { r, g, b } = hexToRgb(hexColor)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const isDark = luminance < 0.55

  return {
    strongText: isDark ? '#f8fafc' : '#0f172a',
    mutedText: isDark ? 'rgba(248,250,252,0.88)' : 'rgba(15,23,42,0.72)',
    softSurface: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)',
    border: isDark ? 'rgba(248,250,252,0.22)' : 'rgba(15,23,42,0.18)',
    chipSurface: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
  }
}

function isMonthlyAverageRow(row: PricingTableRow): row is MonthlyIndicatorRow {
  return row.rowType === 'monthly_average' && typeof row.monthKey === 'string'
}

function getSeriesValue(row: PricingTableRow, seriesCode: PricingSeriesCode) {
  const value = row.values[seriesCode]
  return typeof value === 'number' ? value : null
}

function calculateVariation(previousValue: number | null, currentValue: number | null) {
  if (previousValue === null || currentValue === null || previousValue === 0) {
    return null
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

function buildChartPath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function MiniTrendChart({ color, points }: MiniTrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-[1.25rem] border border-dashed border-border/70 bg-background/50 text-xs text-muted-foreground">
        Sem dados suficientes
      </div>
    )
  }

  const width = 320
  const height = 112
  const paddingX = 18
  const paddingY = 14
  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = maxValue - minValue || Math.max(maxValue * 0.04, 1)
  const normalizedPoints = points.map((point, index, array) => {
    const x =
      array.length === 1
        ? width / 2
        : paddingX + (index * (width - paddingX * 2)) / Math.max(array.length - 1, 1)
    const y =
      height -
      paddingY -
      ((point.value - (minValue - spread * 0.1)) / (spread * 1.2)) * (height - paddingY * 2)

    return {
      ...point,
      x,
      y,
    }
  })

  return (
    <svg className="h-24 w-full" fill="none" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`trend-${color.replace('#', '')}`} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d={buildChartPath(normalizedPoints)}
        fill="none"
        stroke={`url(#trend-${color.replace('#', '')})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {normalizedPoints.map((point) => (
        <circle
          key={`${point.label}-${point.value}`}
          cx={point.x}
          cy={point.y}
          fill="white"
          r="4"
          stroke={color}
          strokeWidth="2"
        />
      ))}
      <line
        stroke="rgba(15, 23, 42, 0.08)"
        strokeDasharray="4 6"
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
      />
    </svg>
  )
}

function TrendCard({
  color,
  summary,
  subtitle,
  unitLabel,
  palette,
}: {
  color: string
  summary: TrendSummary
  subtitle: string
  unitLabel: string
  palette: ContrastPalette
}) {
  const variation = calculateVariation(summary.previousValue, summary.currentValue)
  const trendTone =
    variation === null ? 'neutral' : variation > 0 ? 'positive' : variation < 0 ? 'negative' : 'neutral'

  return (
    <Card
      className="overflow-hidden shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
        borderColor: palette.border,
      }}
    >
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: palette.mutedText }}>
            {summary.title}
          </p>
          <p className="text-sm" style={{ color: palette.mutedText }}>{subtitle}</p>
          <p className="text-xs" style={{ color: palette.mutedText }}>{unitLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: palette.softSurface, borderColor: palette.border }}>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.mutedText }}>
              {summary.previousLabel}
            </p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: palette.strongText }}>
              {summary.previousValue === null ? '-' : formatPricingNumber(summary.previousValue, 2)}
            </p>
          </div>
          <div className="rounded-[1.25rem] border p-4" style={{ backgroundColor: palette.softSurface, borderColor: palette.border }}>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.mutedText }}>
              {summary.currentLabel}
            </p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: palette.strongText }}>
              {summary.currentValue === null ? '-' : formatPricingNumber(summary.currentValue, 2)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-semibold',
            trendTone === 'positive' && 'bg-emerald-50 text-emerald-700',
            trendTone === 'negative' && 'bg-rose-50 text-rose-700',
            trendTone === 'neutral' && 'bg-slate-100 text-slate-700',
          )}
        >
          {trendTone === 'positive' ? <ArrowUpRight className="size-4" /> : null}
          {trendTone === 'negative' ? <ArrowDownRight className="size-4" /> : null}
          {trendTone === 'neutral' ? <Minus className="size-4" /> : null}
          <span>{variation === null ? 'Sem comparação suficiente' : `${variation > 0 ? '+' : ''}${variation.toFixed(2)} %`}</span>
        </div>

        <MiniTrendChart color={color} points={summary.points} />
      </CardContent>
    </Card>
  )
}

function buildDailySummary(rows: PricingTableRow[], seriesCode: PricingSeriesCode, monthKey: string): TrendSummary {
  const dailyRows = rows
    .filter((row) => row.rowType === 'daily' && row.quotedDate?.startsWith(monthKey.slice(0, 7)))
    .sort((left, right) => (left.quotedDate ?? '').localeCompare(right.quotedDate ?? ''))

  const points = dailyRows
    .map((row) => {
      const value = getSeriesValue(row, seriesCode)

      if (value === null || !row.quotedDate) {
        return null
      }

      return {
        label: formatPricingDate(row.quotedDate),
        value,
      }
    })
    .filter((point): point is TrendPoint => point !== null)

  return {
    currentLabel: points.at(-1)?.label ?? 'Último dia',
    currentValue: points.at(-1)?.value ?? null,
    previousLabel: points.at(-2)?.label ?? 'Dia anterior',
    previousValue: points.at(-2)?.value ?? null,
    points,
    title: `Variação diária do ${getSeriesLabel(seriesCode)}`,
  }
}

function buildWeeklySummary(rows: PricingTableRow[], seriesCode: PricingSeriesCode, monthKey: string): TrendSummary {
  const dailyRows = rows.filter(
    (row) => row.rowType === 'daily' && row.quotedDate?.startsWith(monthKey.slice(0, 7)),
  )
  const byWeek = new Map<string, Array<{ quotedDate: string; value: number }>>()

  for (const row of dailyRows) {
    if (!row.quotedDate) {
      continue
    }

    const value = getSeriesValue(row, seriesCode)

    if (value === null) {
      continue
    }

    const { isoWeek, isoYear } = getIsoWeekParts(row.quotedDate)
    const key = `${isoYear}-${String(isoWeek).padStart(2, '0')}`
    const weekRows = byWeek.get(key) ?? []
    weekRows.push({ quotedDate: row.quotedDate, value })
    byWeek.set(key, weekRows)
  }

  const points = Array.from(byWeek.entries())
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, weekRows]) => {
      const [isoYear, isoWeekString] = key.split('-')
      const isoWeek = Number(isoWeekString)
      const average = weekRows.reduce((sum, current) => sum + current.value, 0) / weekRows.length
      return {
        label: `Semana ${isoYear}/${String(isoWeek).padStart(2, '0')}`,
        value: average,
      }
    })

  return {
    currentLabel: points.at(-1)?.label ?? 'Última semana',
    currentValue: points.at(-1)?.value ?? null,
    previousLabel: points.at(-2)?.label ?? 'Semana anterior',
    previousValue: points.at(-2)?.value ?? null,
    points,
    title: `Variação semanal do ${getSeriesLabel(seriesCode)}`,
  }
}

function buildMonthlySummary(rows: PricingTableRow[], seriesCode: PricingSeriesCode, monthKey: string): TrendSummary {
  const monthlyRows = rows.filter(isMonthlyAverageRow).sort((left, right) =>
    left.monthKey > right.monthKey ? 1 : left.monthKey < right.monthKey ? -1 : 0,
  )

  const points = monthlyRows
    .map((row) => {
      const value = getSeriesValue(row, seriesCode)

      if (value === null || !row.monthKey) {
        return null
      }

      return {
        label: formatMonthLabel(row.monthKey),
        value,
      }
    })
    .filter((point): point is TrendPoint => point !== null)

  const selectedIndex = monthlyRows.findIndex((row) => row.monthKey === monthKey)
  const currentRow = selectedIndex >= 0 ? monthlyRows[selectedIndex] : monthlyRows.at(-1) ?? null
  const previousRow = selectedIndex > 0 ? monthlyRows[selectedIndex - 1] : monthlyRows.at(-2) ?? null

  const currentValue = currentRow ? getSeriesValue(currentRow, seriesCode) : null
  const previousValue = previousRow ? getSeriesValue(previousRow, seriesCode) : null

  return {
    currentLabel: currentRow?.monthKey ? formatMonthLabel(currentRow.monthKey) : 'Mês atual',
    currentValue,
    previousLabel: previousRow?.monthKey ? formatMonthLabel(previousRow.monthKey) : 'Mês anterior',
    previousValue,
    points,
    title: `Variação mensal do ${getSeriesLabel(seriesCode)}`,
  }
}

export function PricingMonthlyIndicators({ rows }: { rows: PricingTableRow[] }) {
  const monthOptions = useMemo(
    () =>
      rows
        .filter(isMonthlyAverageRow)
        .sort((left, right) => (left.monthKey > right.monthKey ? -1 : left.monthKey < right.monthKey ? 1 : 0))
        .map((row) => ({
          label: row.monthKey ? formatMonthLabel(row.monthKey) : 'Mês sem rótulo',
          value: row.monthKey,
        })),
    [rows],
  )

  const [selectedMonthKey, setSelectedMonthKey] = useState('')
  const [selectedSeriesCode, setSelectedSeriesCode] = useState<PricingSeriesCode>(
    pricingSeriesCatalog[0]?.code ?? 'CU',
  )
  const selectedMonth =
    monthOptions.find((option) => option.value === selectedMonthKey) ?? monthOptions[0] ?? null
  const selectedSeries =
    pricingSeriesCatalog.find((series) => series.code === selectedSeriesCode) ?? pricingSeriesCatalog[0]
  const activeMonthKey = selectedMonth?.value ?? ''
  const activeSeriesCode = selectedSeries?.code ?? pricingSeriesCatalog[0]?.code ?? 'CU'
  const activeSeriesUnitLabel = getSeriesUnitLabel(activeSeriesCode)
  const activeSeriesPalette = getContrastPalette(selectedSeries.color)

  const dailySummary = selectedMonth
    ? buildDailySummary(rows, activeSeriesCode, activeMonthKey)
    : null
  const weeklySummary = selectedMonth
    ? buildWeeklySummary(rows, activeSeriesCode, activeMonthKey)
    : null
  const monthlySummary = selectedMonth
    ? buildMonthlySummary(rows, activeSeriesCode, activeMonthKey)
    : null

  if (!selectedMonth || !selectedSeries || monthOptions.length === 0) {
    return (
      <Card className="overflow-hidden rounded-[1.95rem] border-border/80">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Ainda não há histórico mensal suficiente para exibir os indicadores.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden rounded-[1.95rem] border-border/80">
      <CardHeader className="border-b border-border/70 bg-[linear-gradient(180deg,#fbfcfb_0%,#f4f7f3_100%)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Indicadores mensais
            </p>
            <CardTitle className="text-2xl">{`Indicadores de ${selectedMonth.label}`}</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Escolha o mês e o material para comparar a evolução diária, semanal e mensal da série.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-[320px] sm:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Selecione o mês
              </p>
              <Select
                onChange={(event) => setSelectedMonthKey(event.target.value)}
                value={activeMonthKey}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Material
              </p>
              <div className="flex flex-wrap gap-2">
                {pricingSeriesCatalog.map((series) => (
                  <Button
                    key={series.code}
                    onClick={() => setSelectedSeriesCode(series.code)}
                    size="sm"
                    type="button"
                    variant={series.code === activeSeriesCode ? 'default' : 'outline'}
                    className={cn(
                      'rounded-full px-3',
                      series.code === activeSeriesCode && 'shadow-sm',
                    )}
                    style={{
                      backgroundColor:
                        series.code === activeSeriesCode
                          ? series.color
                          : `${series.color}1f`,
                      borderColor: `${series.color}66`,
                      color:
                        series.code === activeSeriesCode
                          ? getContrastPalette(series.color).strongText
                          : '#0f172a',
                    }}
                  >
                    {series.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          Série ativa: <span className="font-medium text-foreground">{getSeriesLabel(selectedSeries.code)}</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {dailySummary ? (
            <TrendCard
              color={selectedSeries.color}
              summary={dailySummary}
              subtitle={`Dentro de ${selectedMonth.label}`}
              unitLabel={activeSeriesUnitLabel}
              palette={activeSeriesPalette}
            />
          ) : null}
          {weeklySummary ? (
            <TrendCard
              color={selectedSeries.color}
              summary={weeklySummary}
              subtitle={`Semanas de ${selectedMonth.label}`}
              unitLabel={activeSeriesUnitLabel}
              palette={activeSeriesPalette}
            />
          ) : null}
          {monthlySummary ? (
            <TrendCard
              color={selectedSeries.color}
              summary={monthlySummary}
              subtitle="Comparação com os meses carregados"
              unitLabel={activeSeriesUnitLabel}
              palette={activeSeriesPalette}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
