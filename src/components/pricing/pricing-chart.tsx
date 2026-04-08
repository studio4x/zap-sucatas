import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PricingChartSeries, PricingSeriesCode } from '@/domains/pricing/types'
import { formatPricingDate, formatPricingNumber } from '@/domains/pricing/utils'

type PricingChartProps = {
  className?: string
  series: PricingChartSeries[]
}

function buildChartPath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

export function PricingChart({ className, series }: PricingChartProps) {
  const [selectedCode, setSelectedCode] = useState<PricingSeriesCode | null>(series[0]?.code ?? null)

  useEffect(() => {
    if (!series.some((item) => item.code === selectedCode)) {
      setSelectedCode(series[0]?.code ?? null)
    }
  }, [selectedCode, series])

  const activeSeries = series.find((item) => item.code === selectedCode) ?? series[0] ?? null

  if (!activeSeries) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Historico LME</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ainda nao ha snapshots suficientes para desenhar o grafico.
        </CardContent>
      </Card>
    )
  }

  const width = 860
  const height = 320
  const paddingX = 40
  const paddingY = 28
  const values = activeSeries.points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = maxValue - minValue || Math.max(maxValue * 0.04, 1)
  const normalizedPoints = activeSeries.points.map((point, index, array) => {
    const x =
      array.length === 1
        ? width / 2
        : paddingX + (index * (width - paddingX * 2)) / Math.max(array.length - 1, 1)
    const y = height - paddingY - ((point.value - (minValue - spread * 0.1)) / (spread * 1.2)) * (height - paddingY * 2)

    return {
      ...point,
      x,
      y,
    }
  })
  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3
    const value = maxValue - ratio * spread
    const y = paddingY + ratio * (height - paddingY * 2)
    return { value, y }
  })
  const xLabelIndexes = Array.from(
    new Set([
      0,
      Math.floor((normalizedPoints.length - 1) * 0.25),
      Math.floor((normalizedPoints.length - 1) * 0.5),
      Math.floor((normalizedPoints.length - 1) * 0.75),
      normalizedPoints.length - 1,
    ]),
  ).filter((index) => index >= 0)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-4 border-b border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Historico LME
            </p>
            <CardTitle className="mt-2">{activeSeries.label}</CardTitle>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/40 px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ultimo ponto</p>
            <p className="text-lg font-semibold text-foreground">
              {formatPricingNumber(activeSeries.points[activeSeries.points.length - 1]?.value ?? 0, 2)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <button
              key={item.code}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                item.code === activeSeries.code
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border/70 bg-background text-foreground hover:border-primary/30',
              )}
              onClick={() => setSelectedCode(item.code)}
              style={item.code === activeSeries.code ? { backgroundColor: item.color } : undefined}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <div className="overflow-x-auto">
          <svg
            className="min-w-[760px]"
            fill="none"
            viewBox={`0 0 ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  stroke="rgba(15, 23, 42, 0.09)"
                  strokeDasharray="4 6"
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={tick.y}
                  y2={tick.y}
                />
                <text
                  fill="currentColor"
                  fontSize="12"
                  textAnchor="start"
                  x={4}
                  y={tick.y + 4}
                >
                  {formatPricingNumber(tick.value, 2)}
                </text>
              </g>
            ))}

            <path
              d={buildChartPath(normalizedPoints)}
              stroke={activeSeries.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {normalizedPoints.map((point) => (
              <circle
                key={`${activeSeries.code}-${point.quotedDate}`}
                cx={point.x}
                cy={point.y}
                fill="white"
                r="4.5"
                stroke={activeSeries.color}
                strokeWidth="2.5"
              />
            ))}

            {xLabelIndexes.map((index) => {
              const point = normalizedPoints[index]

              return (
                <text
                  key={`${point.quotedDate}-${index}`}
                  fill="currentColor"
                  fontSize="12"
                  textAnchor="middle"
                  x={point.x}
                  y={height - 4}
                >
                  {formatPricingDate(point.quotedDate)}
                </text>
              )
            })}
          </svg>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          O grafico trabalha com uma serie por vez para manter leitura limpa no desktop e no
          mobile, priorizando leitura e comparacao por periodo.
        </p>
      </CardContent>
    </Card>
  )
}
