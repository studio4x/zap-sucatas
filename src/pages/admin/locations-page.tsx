import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminLocationsPage() {
  return (
    <PagePlaceholder
      description="Area reservada para futura normalizacao de estados e cidades, sem expandir o escopo do MVP alem do blueprint."
      eyebrow="Admin / localidades"
      highlights={[
        'Lacuna assumida e sinalizada',
        'Cidade e estado seguem denormalizados no MVP',
        'Ponto de extensao para proxima iteracao',
      ]}
      title="Gestao de localidades"
    />
  )
}
