import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminBlogPage() {
  return (
    <PagePlaceholder
      description="CRUD do blog nativo com posts, categorias, slugs, rascunhos e publicacao."
      eyebrow="Admin / blog"
      highlights={[
        'Fluxo editorial com status',
        'SEO por post',
        'Conexao futura com editor rich text',
      ]}
      title="Gestao do blog"
    />
  )
}
