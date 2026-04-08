import { ArrowUpRight, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicListingCategory } from '@/domains/categories/types'
import { PublicSectionHeading } from '@/components/public/public-section-heading'

type CategoryHighlightsProps = {
  categories: PublicListingCategory[]
}

export function CategoryHighlights({ categories }: CategoryHighlightsProps) {
  return (
    <section className="space-y-6">
      <PublicSectionHeading
        description="Descubra rápido os principais segmentos do portal e entre em páginas com recorte comercial e SEO próprio."
        eyebrow="Categorias"
        title="Setores que movem o catálogo"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} to={paths.public.categoryDetails(category.slug)}>
            <Card className="h-full border-border/80 transition duration-200 hover:-translate-y-1 hover:border-primary/35">
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
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
