import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppOverviewPage() {
  return (
    <PagePlaceholder
      description="Visao geral do anunciante com totais por status, perguntas sem resposta e atalhos operacionais."
      eyebrow="Dashboard"
      highlights={[
        'Indicadores rapidos por anuncio',
        'Atalhos para criar e editar',
        'Base para analytics operacional',
      ]}
      title="Visao geral do anunciante"
    />
  )
}
