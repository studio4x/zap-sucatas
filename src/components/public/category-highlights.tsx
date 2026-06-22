import { ArrowUpRight, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicListingCategoryNode } from '@/domains/categories/types'
import { PublicSectionHeading } from '@/components/public/public-section-heading'

type CategoryHighlightsProps = {
  categories: PublicListingCategoryNode[]
}

export function CategoryHighlights({ categories }: CategoryHighlightsProps) {
  return (
    <section className="space-y-6">
      <PublicSectionHeading
        actions={
          <Button asChild variant="outline">
            <Link to={paths.public.listings}>Abrir catálogo completo</Link>
          </Button>
        }
        description="Descubra rápido os principais segmentos do portal e entre em páginas com recorte comercial e SEO próprio."
        eyebrow="Categorias"
        title="Setores que movem o catálogo"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Card key={category.id} className="h-full border-border/80 transition duration-200 hover:-translate-y-1 hover:border-primary/35">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Layers3 className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl tracking-tight text-foreground">
                  {category.name}
                </h3>
                <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
                  {category.description ?? 'Página dedicada com anúncios aprovados, contexto do segmento e descoberta rápida.'}
                </p>
              </div>
              <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
                {category.approvedListings} anúncios publicados
              </Badge>
              <Button asChild className="w-full justify-center" variant="outline">
                <Link to={paths.public.categoryDetails(category.slug)}>Abrir categoria</Link>
              </Button>
              {category.children.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Subcategorias
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.children.slice(0, 4).map((child) => (
                      <Link
                        key={child.id}
                        to={paths.public.categoryDetails(child.slug)}
                        className="inline-flex items-center rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary/35 hover:text-primary"
                      >
                        {child.name}
                      </Link>
                    ))}
                    {category.children.length > 4 ? (
                      <span className="inline-flex items-center rounded-full border border-dashed border-border/70 bg-secondary/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                        +{category.children.length - 4} outras
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
