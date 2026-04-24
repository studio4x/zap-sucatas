import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PricingChart } from '@/components/pricing/pricing-chart'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { PricingUpdateOverview } from '@/components/pricing/pricing-update-overview'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
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
      <section className="overflow-hidden rounded-[2.2rem] border border-[#d8e3d8] bg-[linear-gradient(180deg,#f8fbf7_0%,#f2f6f1_100%)]">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              actions={
                <Button asChild variant="outline">
                  <Link to={paths.public.listings}>Explorar anuncios</Link>
                </Button>
              }
              description="Ferramenta publica para acompanhar precos manuais de sucata, historico dos metais e referencia de atualizacao do mercado."
              eyebrow="Tabela de precos"
              title="Leitura publica de metais e referencias comerciais"
            />
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Historico consolidado
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Atualizacao operacional
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Apoio a negociacao
              </Badge>
            </div>
          </div>

          <Card className="rounded-[1.8rem] border-[#d8e3d8] bg-[linear-gradient(180deg,#173629_0%,#0d241a_100%)] text-white shadow-[0_30px_70px_-40px_rgba(12,34,25,0.9)]">
            <CardContent className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/72">
                Janela operacional
              </p>
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {formatPricingDate(data.latestQuotedDate)}
                </p>
                <p className="text-sm leading-7 text-emerald-50/78">
                  Ultima consolidacao disponivel do historico publico de precos.
                </p>
              </div>
              <div className="space-y-2 border-t border-white/12 pt-4 text-sm text-emerald-50/82">
                <p>Historico: {data.historyWindowLabel}</p>
                <p>Grafico: {data.chartWindowLabel}</p>
                <p>Atualizacao manual: {formatPricingDateTime(data.lastManualUpdate)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PricingUpdateOverview
        historySnapshotCount={data.historySnapshotCount}
        historyWindowLabel={data.historyWindowLabel}
        lastManualUpdate={data.lastManualUpdate}
        latestQuotedDate={data.latestQuotedDate}
        latestValues={data.latestValues}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <PricingChart series={data.chartSeries} />

        <Card className="rounded-[1.85rem] border-border/80">
          <CardHeader>
            <CardTitle>Janela operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-4 text-sm leading-7 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Tabela historica:</span>{' '}
                {data.historyWindowLabel}
              </p>
              <p>
                <span className="font-medium text-foreground">Grafico:</span> {data.chartWindowLabel}
              </p>
              <p>
                <span className="font-medium text-foreground">Ultima data consolidada:</span>{' '}
                {formatPricingDate(data.latestQuotedDate)}
              </p>
              <p>
                <span className="font-medium text-foreground">Snapshots no grafico:</span>{' '}
                {data.chartSnapshotCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <tr className="bg-[#166246] text-left text-white">
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
