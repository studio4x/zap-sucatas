import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminListingsPage() {
  return (
    <PagePlaceholder
      description="Gestao administrativa dos anuncios com busca, filtros, badges de status e entrada para moderacao."
      eyebrow="Admin / anuncios"
      highlights={[
        'Fila operacional por status',
        'Busca e filtros administrativos',
        'Acao rapida de moderacao',
      ]}
      title="Gestao administrativa de anuncios"
    />
  )
}
