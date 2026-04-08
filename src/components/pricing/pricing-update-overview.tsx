import { Card, CardContent } from '@/components/ui/card'
import type { PricingSeriesCode } from '@/domains/pricing/types'
import { formatPricingDate, formatPricingDateTime, formatPricingNumber, getSeriesLabel, pricingSeriesCatalog } from '@/domains/pricing/utils'

type PricingUpdateOverviewProps = {
  historySnapshotCount: number
  historyWindowLabel: string
  lastManualUpdate: string | null
  latestQuotedDate: string | null
  latestValues: Partial<Record<PricingSeriesCode, number>>
}

export function PricingUpdateOverview({
  historySnapshotCount,
  historyWindowLabel,
  lastManualUpdate,
  latestQuotedDate,
  latestValues,
}: PricingUpdateOverviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ultima cotacao LME
            </p>
            <p className="font-display text-2xl text-foreground">
              {formatPricingDate(latestQuotedDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Atualizacao manual
            </p>
            <p className="font-display text-2xl text-foreground">
              {formatPricingDateTime(lastManualUpdate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Snapshots na tabela
            </p>
            <p className="font-display text-2xl text-foreground">{historySnapshotCount}</p>
            <p className="text-xs text-muted-foreground">{historyWindowLabel}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {pricingSeriesCatalog.map((series) => (
            <div key={series.code} className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {getSeriesLabel(series.code)}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {typeof latestValues[series.code] === 'number'
                  ? formatPricingNumber(latestValues[series.code] ?? 0, 2)
                  : '-'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
