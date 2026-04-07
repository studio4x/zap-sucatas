import { paths } from '@/app/paths'
import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function HomePage() {
  return (
    <PagePlaceholder
      actions={[
        {
          label: 'Ver anuncios',
          to: paths.public.listings,
        },
        {
          label: 'Quero anunciar',
          to: paths.auth.register,
          variant: 'outline',
        },
      ]}
      description="Home comercial do MVP com hero, categorias, destaques, bloco de precos, artigos recentes, FAQ e CTA permanente para anunciar."
      eyebrow="Home comercial"
      highlights={[
        'Hero forte com proposta de valor',
        'Atalho para catalogo e onboarding do anunciante',
        'Base pronta para conteudo e destaques recentes',
      ]}
      title="Marketplace moderado para sucatas e maquinarios"
    />
  )
}
