import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PricingChart } from '@/components/pricing/pricing-chart'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { PricingUpdateOverview } from '@/components/pricing/pricing-update-overview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import { formatPricingDate, formatPricingDateTime, formatPricingNumber } from '@/domains/pricing/utils'

export function PricingPage() {
  const [monthKey, setMonthKey] = useState('')
  const pricingQuery = useQuery({
    queryKey: ['pricing', 'public', monthKey],
    queryFn: () => fetchPublicPricingPageData(monthKey || undefined),
  })

  useEffect(() => {
    if (!monthKey && pricingQuery.data?.selectedMonthKey) {
      setMonthKey(pricingQuery.data.selectedMonthKey)
    }
  }, [monthKey, pricingQuery.data?.selectedMonthKey])

  if (pricingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando tabela de precos...
        </CardContent>
      </Card>
    )
  }

  if (pricingQuery.isError || !pricingQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar a tabela de precos neste momento.
        </CardContent>
      </Card>
    )
  }

  const data = pricingQuery.data

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Cotacao LME
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Preco dos metais e referencia de sucatas
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          Painel publico com historico diario dos metais acompanhados no MVP, medias semanais,
          media do periodo e tabela manual de referencias comerciais para sucata.
        </p>
      </div>

      <PricingUpdateOverview
        lastManualUpdate={data.lastManualUpdate}
        latestQuotedDate={data.latestQuotedDate}
        latestValues={data.latestValues}
        snapshotCount={data.snapshotCount}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <PricingChart series={data.chartSeries} />

        <Card>
          <CardHeader>
            <CardTitle>Periodo exibido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setMonthKey(event.target.value)}
              value={data.selectedMonthKey ?? ''}
            >
              {data.periods.map((period) => (
                <option key={period.monthKey} value={period.monthKey}>
                  {period.monthLabel}
                </option>
              ))}
            </select>

            <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Ultima data do periodo:</span>{' '}
                {formatPricingDate(
                  data.periods.find((period) => period.monthKey === data.selectedMonthKey)?.lastQuotedDate ?? null,
                )}
              </p>
              <p>
                <span className="font-medium text-foreground">Dias de cotacao:</span>{' '}
                {data.periods.find((period) => period.monthKey === data.selectedMonthKey)?.tradingDays ?? 0}
              </p>
              <p>
                <span className="font-medium text-foreground">Atualizacao manual:</span>{' '}
                {formatPricingDateTime(data.lastManualUpdate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingHistoryTable rows={data.historyRows} title="Historico consolidado" />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Referencias comerciais de sucata</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.manualEntries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhuma referencia manual foi publicada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[780px] border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-600 text-left text-white">
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Regiao</th>
                    <th className="px-4 py-3 font-semibold">Preco</th>
                    <th className="px-4 py-3 font-semibold">Unidade</th>
                    <th className="px-4 py-3 font-semibold">Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {data.manualEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60">
                      <td className="px-4 py-3 text-foreground">{entry.materialName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.regionName ?? 'Brasil'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{entry.priceLabel}</span>
                          {typeof entry.priceNumeric === 'number' ? (
                            <span className="text-xs text-muted-foreground">
                              {formatPricingNumber(entry.priceNumeric, 2)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.priceUnit ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatPricingDate(entry.effectiveDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
