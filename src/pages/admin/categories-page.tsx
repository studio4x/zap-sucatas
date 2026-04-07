import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminCategoriesPage() {
  return (
    <PagePlaceholder
      description="CRUD de categorias com ordenacao, ativacao e descricao para alimentar o catalogo publico."
      eyebrow="Admin / categorias"
      highlights={[
        'Ordenacao configuravel',
        'Ativacao e desativacao de categorias',
        'Base para navegacao e SEO',
      ]}
      title="Gestao de categorias"
    />
  )
}
