import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminListingDetailsPage() {
  return (
    <PagePlaceholder
      description="Detalhe administrativo do anuncio com timeline, contexto de aprovacao/rejeicao e rastreabilidade."
      eyebrow="Admin / detalhe"
      highlights={[
        'Timeline operacional do anuncio',
        'Motivo de rejeicao obrigatorio',
        'Base para auditoria por entidade',
      ]}
      title="Detalhe administrativo do anuncio"
    />
  )
}
