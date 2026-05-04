import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PricingTableRow } from '@/domains/pricing/types'
import { formatMonthLabel, formatPricingNumber, pricingSeriesCatalog } from '@/domains/pricing/utils'

type PricingHistoryTableProps = {
  rows: PricingTableRow[]
  title?: string
}

function getRowClassName(rowType: PricingTableRow['rowType']) {
  if (rowType === 'weekly_average') {
    return 'bg-emerald-50 font-medium text-emerald-950'
  }

  if (rowType === 'monthly_average') {
    return 'bg-amber-50 font-semibold text-amber-950'
  }

  if (rowType === 'period_average') {
    return 'bg-slate-100 font-semibold text-slate-950'
  }

  return 'bg-background text-foreground'
}

export function PricingHistoryTable({ rows, title = 'Tabela histórica' }: PricingHistoryTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Ainda não há histórico suficiente para montar a tabela.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-600 text-left text-white">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  {pricingSeriesCatalog.map((series) => (
                    <th key={series.code} className="px-4 py-3 font-semibold">
                      {series.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.rowType}-${row.quotedDate ?? row.weekLabel ?? 'period'}-${index}`}
                    className={getRowClassName(row.rowType)}
                  >
                    <td className="border-b border-border/60 px-4 py-3">
                      <div className="flex flex-col">
                        <span>{row.label}</span>
                        {row.monthKey ? (
                          <span className="text-xs uppercase tracking-[0.16em] text-current/70">
                            {formatMonthLabel(row.monthKey)}
                          </span>
                        ) : row.weekLabel ? (
                          <span className="text-xs uppercase tracking-[0.16em] text-current/70">
                            {row.weekLabel}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {pricingSeriesCatalog.map((series) => (
                      <td key={`${row.label}-${series.code}`} className="border-b border-border/60 px-4 py-3">
                        {typeof row.values[series.code] === 'number'
                          ? formatPricingNumber(row.values[series.code] ?? 0, 2)
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
