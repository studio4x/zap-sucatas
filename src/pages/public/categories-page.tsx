import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { CategoryHighlights } from '@/components/public/category-highlights'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchPublicCategories } from '@/domains/categories/api'

export function CategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'public', 'page'],
    queryFn: fetchPublicCategories,
  })

  const stats = useMemo(() => {
    const categories = categoriesQuery.data ?? []

    return {
      activeCategories: categories.length,
      mostActive: categories.reduce((acc, item) => Math.max(acc, item.approvedListings), 0),
      totalApproved: categories.reduce((acc, item) => acc + item.approvedListings, 0),
    }
  }, [categoriesQuery.data])

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="overflow-hidden rounded-[2.2rem] border border-border bg-white">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              actions={
                <Button asChild variant="outline">
                  <Link to={paths.public.listings}>Abrir catálogo completo</Link>
                </Button>
              }
              description="Navegue pelos principais recortes do portal e encontre anúncios com mais rapidez por segmento de sucata, metal ou maquinário."
              eyebrow="Categorias"
              title="Explore o mercado por segmento"
            />
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                SEO por categoria
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Descoberta orientada ao catálogo
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Navegação setorial mais rápida
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Categorias
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {stats.activeCategories}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Maior volume
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {stats.mostActive}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/85 bg-white/88 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Anúncios publicados
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {stats.totalApproved}
              </p>
            </div>
          </div>
        </div>
      </section>

      {categoriesQuery.isLoading ? (
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 text-sm text-muted-foreground">
          Carregando categorias públicas...
        </div>
      ) : null}

      {categoriesQuery.data?.length ? (
        <CategoryHighlights categories={categoriesQuery.data} />
      ) : (
        <PublicEmptyState
          description="As categorias públicas aparecerão aqui quando o catálogo estiver mais preenchido."
          title="Categorias ainda em preparação"
        />
      )}

      <CtaBanner
        actionLabel="Quero publicar um anúncio"
        actionTo={paths.auth.register}
        description="Se você atua no mercado de sucatas, publique seu lote em uma plataforma pensada para descoberta e negociação."
        title="Leve seu anúncio para um portal especializado em mercado industrial."
      />
    </div>
  )
}