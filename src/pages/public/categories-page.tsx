import { useQuery } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { CategoryHighlights } from '@/components/public/category-highlights'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { fetchPublicCategories } from '@/domains/categories/api'
import { getLeafCategoryNodes } from '@/domains/categories/utils'

export function CategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'public', 'page'],
    queryFn: fetchPublicCategories,
  })
  const leafCategories = getLeafCategoryNodes(categoriesQuery.data ?? [])

  return (
    <div className="space-y-8 lg:space-y-10">
      {categoriesQuery.isLoading ? (
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 text-sm text-muted-foreground">
          Carregando categorias públicas...
        </div>
      ) : null}

      {leafCategories.length ? (
        <CategoryHighlights categories={leafCategories} />
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
