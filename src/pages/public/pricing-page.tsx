import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PricingChart } from '@/components/pricing/pricing-chart'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { PricingUpdateOverview } from '@/components/pricing/pricing-update-overview'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import {
  formatPricingDate,
  formatPricingDateTime,
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
          Carregando tabela de preços...
        </CardContent>
      </Card>
    )
  }

  if (pricingQuery.isError || !pricingQuery.data) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Não foi possível carregar a tabela de preços neste momento.
        </CardContent>
      </Card>
    )
  }

  const data = pricingQuery.data

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        actions={
          <Button asChild variant="outline">
            <Link to={paths.public.listings}>Explorar anúncios</Link>
          </Button>
        }
        description="Ferramenta pública para acompanhar preços manuais de sucata, histórico diário dos metais e referência de atualização do mercado."
        eyebrow="Tabela de preços"
        title="Leitura pública de metais e referências comerciais"
      />

      <PricingUpdateOverview
        historySnapshotCount={data.historySnapshotCount}
        historyWindowLabel={data.historyWindowLabel}
        lastManualUpdate={data.lastManualUpdate}
        latestQuotedDate={data.latestQuotedDate}
        latestValues={data.latestValues}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <PricingChart series={data.chartSeries} />

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Janela operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-4 text-sm leading-7 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Tabela histórica:</span>{' '}
                {data.historyWindowLabel}
              </p>
              <p>
                <span className="font-medium text-foreground">Gráfico:</span> {data.chartWindowLabel}
              </p>
              <p>
                <span className="font-medium text-foreground">Última data consolidada:</span>{' '}
                {formatPricingDate(data.latestQuotedDate)}
              </p>
              <p>
                <span className="font-medium text-foreground">Snapshots no gráfico:</span>{' '}
                {data.chartSnapshotCount}
              </p>
              <p>
                <span className="font-medium text-foreground">Atualização manual:</span>{' '}
                {formatPricingDateTime(data.lastManualUpdate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingHistoryTable rows={data.historyRows} title="Histórico consolidado dos últimos 6 meses" />

      <Card className="overflow-hidden border-border/80">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Referências comerciais de sucata</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.manualEntries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhuma referência manual foi publicada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[780px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#166246] text-left text-white">
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Região</th>
                    <th className="px-4 py-3 font-semibold">Preço</th>
                    <th className="px-4 py-3 font-semibold">Unidade</th>
                    <th className="px-4 py-3 font-semibold">Vigência</th>
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
        description="Use a leitura de preços para embasar sua negociação e publique seus anúncios em um portal focado no mercado de sucatas e maquinários."
        title="Quer transformar referência de mercado em oportunidade comercial?"
      />
    </div>
  )
}
