import { useQuery } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { PricingMonthlyIndicators } from '@/components/pricing/pricing-monthly-indicators'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { CtaBanner } from '@/components/public/cta-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import {
  formatPricingDate,
  formatPricingNumber,
} from '@/domains/pricing/utils'

export function PricingPage() {
  const pricingQuery = useQuery({
    queryKey: ['pricing', 'public'],
    queryFn: fetchPublicPricingPageData,
  })

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
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Nao foi possivel carregar a tabela de precos neste momento.
        </CardContent>
      </Card>
    )
  }

  const data = pricingQuery.data

  return (
    <div className="space-y-8 lg:space-y-10">
      <PricingMonthlyIndicators rows={data.historyRows} />

      <PricingHistoryTable rows={data.historyRows} title="Historico consolidado dos ultimos 6 meses" />

      <Card className="overflow-hidden rounded-[1.95rem] border-border/80">
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
                  <tr className="bg-[#27991f] text-left text-white">
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
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.regionName ?? 'Brasil'}
                      </td>
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

      <CtaBanner
        actionLabel="Criar conta para anunciar"
        actionTo={paths.auth.register}
        description="Use a leitura de preços para embasar sua negociação e publique seus anúncios em um portal focado no mercado de sucatas."
        title="Quer transformar referencia de mercado em oportunidade comercial?"
      />
    </div>
  )
}
