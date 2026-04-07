import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminPricingPage() {
  return (
    <PagePlaceholder
      description="Gestao da tabela de precos manual e historico LME, com preparacao para sincronizacao externa."
      eyebrow="Admin / precos"
      highlights={[
        'Entradas manuais por material',
        'Snapshots LME historicos',
        'Ponto de disparo da sync externa',
      ]}
      title="Gestao de precos"
    />
  )
}
