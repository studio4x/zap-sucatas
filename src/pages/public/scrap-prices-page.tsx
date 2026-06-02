import { useQuery } from '@tanstack/react-query'
import { fetchPublicScrapPrices } from '@/domains/scrap-prices/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicSectionHeading } from '@/components/public/public-section-heading'

export function ScrapPricesPage() {
  const pricesQuery = useQuery({
    queryKey: ['scrap-prices', 'public'],
    queryFn: fetchPublicScrapPrices,
  })

  if (pricesQuery.isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-sm text-muted-foreground">Carregando preço das sucatas...</CardContent>
      </Card>
    )
  }

  if (pricesQuery.isError) {
    return (
      <Card className="w-full border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Não foi possível carregar o preço das sucatas neste momento.
        </CardContent>
      </Card>
    )
  }

  const items = pricesQuery.data ?? []

  return (
    <section className="flex w-full flex-col items-center space-y-8">
      <div className="w-full rounded-[2rem] border border-border bg-card p-6">
        <PublicSectionHeading
          description="Referência pública para acompanhar produtos, preços e quantidades no mercado de sucatas."
          eyebrow="Preço das Sucatas"
          title="Tabela de preço do ferro velho"
        />
      </div>

      <Card className="w-full overflow-hidden rounded-[1.9rem] border-border/80">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Preço das Sucatas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum preço de sucata publicado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#27991f] text-left text-white">
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Preço</th>
                    <th className="px-4 py-3 font-semibold">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-b border-border/60" key={item.id}>
                      <td className="px-4 py-3 text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-foreground">{item.priceLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.quantityLabel}</td>
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