import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { CtaBanner } from '@/components/public/cta-banner'
import { ListingGrid } from '@/components/public/listing-grid'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicCategoryBySlug } from '@/domains/categories/api'
import { fetchPublicListings } from '@/domains/listings/api'

export function CategoryDetailsPage() {
  const { slug = '' } = useParams()

  const categoryQuery = useQuery({
    queryKey: ['categories', 'public', slug],
    queryFn: () => fetchPublicCategoryBySlug(slug),
    enabled: Boolean(slug),
  })

  const listingsQuery = useQuery({
    queryKey: ['listings', 'public', 'category', categoryQuery.data?.id],
    queryFn: () =>
      fetchPublicListings({
        categoryId: categoryQuery.data?.id ?? '',
      }),
    enabled: Boolean(categoryQuery.data?.id),
  })

  if (categoryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando categoria...
        </CardContent>
      </Card>
    )
  }

  if (categoryQuery.isError || !categoryQuery.data) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Não foi possível carregar a categoria solicitada.
        </CardContent>
      </Card>
    )
  }

  const category = categoryQuery.data

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        actions={
          <Button asChild variant="outline">
            <Link to={paths.public.categories}>Ver todas as categorias</Link>
          </Button>
        }
        description={
          category.description ??
          'Recorte comercial com anúncios aprovados, descoberta direcionada e navegação clara para o segmento.'
        }
        eyebrow="Categoria"
        title={category.name}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Anúncios publicados
            </p>
            <p className="text-3xl font-semibold text-foreground">{category.approvedListings}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Especialidade
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              Página dedicada para descoberta rápida e SEO próprio no segmento.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Publicação
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              O catálogo só mostra anúncios aprovados pela moderação da plataforma.
            </p>
          </CardContent>
        </Card>
      </div>

      <ListingGrid
        emptyDescription="Ainda não há anúncios publicados nesta categoria. Você pode explorar outras categorias ou publicar o primeiro anúncio deste segmento."
        emptyTitle="Sem anúncios nesta categoria"
        listings={listingsQuery.data ?? []}
      />

      <CtaBanner
        actionLabel="Anunciar nesta categoria"
        actionTo={paths.auth.register}
        description="Publique seu lote com contexto comercial e alcance um público que já navega por este segmento do portal."
        title={`Tem ${category.name.toLowerCase()} para vender?`}
      />
    </div>
  )
}
