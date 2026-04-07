import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function BlogPostPage() {
  return (
    <PagePlaceholder
      description="Detalhe do post com slug, capa, conteudo estruturado e metadados SEO dedicados."
      eyebrow="Post"
      highlights={[
        'SEO title e description por artigo',
        'Estrutura pronta para renderizar content jsonb',
        'Integracao futura com cover image do storage',
      ]}
      title="Detalhe do post"
    />
  )
}
