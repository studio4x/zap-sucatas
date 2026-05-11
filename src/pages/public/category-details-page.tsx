import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { CtaBanner } from '@/components/public/cta-banner'
import { ListingGrid } from '@/components/public/listing-grid'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicCategoryBySlug } from '@/domains/categories/api'
import { fetchPublicListingsPage } from '@/domains/listings/api'

const PAGE_SIZE = 9

export function CategoryDetailsPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState(1)

  const categoryQuery = useQuery({
    queryKey: ['categories', 'public', slug],
    queryFn: () => fetchPublicCategoryBySlug(slug),
    enabled: Boolean(slug),
  })

  const listingsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['listings', 'public', 'category-page', categoryQuery.data?.id, page],
    queryFn: () =>
      fetchPublicListingsPage({
        categoryId: categoryQuery.data?.id ?? '',
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: Boolean(categoryQuery.data?.id),
  })

  const totalCount = listingsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

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
          Nao foi possivel carregar a categoria solicitada.
        </CardContent>
      </Card>
    )
  }

  const category = categoryQuery.data

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="overflow-hidden rounded-[2.2rem] border border-border bg-white">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              actions={
                <Button asChild variant="outline">
                  <Link to={paths.public.categories}>Ver todas as categorias</Link>
                </Button>
              }
              description={
                category.description ??
                'Recorte comercial com anuncios aprovados, descoberta direcionada e navegacao clara para o segmento.'
              }
              eyebrow="Categoria"
              title={category.name}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Anuncios publicados
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {category.approvedListings}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Descoberta
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Pagina dedicada para leitura setorial e navegacao mais rapida.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Moderacao
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                O catalogo so mostra anuncios aprovados pela plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ListingGrid
        emptyDescription="Ainda nao ha anuncios publicados nesta categoria. Voce pode explorar outras categorias ou publicar o primeiro anuncio deste segmento."
        emptyTitle="Sem anuncios nesta categoria"
        listings={listingsQuery.data?.items ?? []}
      />

      {totalCount > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 rounded-[1.7rem] border border-border bg-card/88 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-[1.1rem] border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-[1.1rem] border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Proxima
            </button>
          </div>
        </div>
      ) : null}

      <CtaBanner
        actionLabel="Anunciar nesta categoria"
        actionTo={paths.auth.register}
        description="Publique seu lote com contexto comercial e alcance um publico que ja navega por este segmento do portal."
        title={`Tem ${category.name.toLowerCase()} para vender?`}
      />
    </div>
  )
}
