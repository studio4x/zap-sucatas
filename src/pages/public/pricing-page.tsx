import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function PricingPage() {
  return (
    <PagePlaceholder
      description="Pagina publica de tabela de precos com entradas internas de sucata, bloco LME e referencia da ultima atualizacao."
      eyebrow="Precos"
      highlights={[
        'Tabela manual por material e regiao',
        'Snapshots LME historicos',
        'Data de atualizacao visivel ao mercado',
      ]}
      title="Tabela de precos publica"
    />
  )
}
