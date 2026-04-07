import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppEditListingPage() {
  return (
    <PagePlaceholder
      description="Tela de edicao do anuncio para manutencao, correcao apos rejeicao e preparacao para submissao."
      eyebrow="Editar anuncio"
      highlights={[
        'Reuso do formulario principal',
        'Contexto de moderacao e rejeicao',
        'Atualizacao granular de midia e atributos',
      ]}
      title="Editar anuncio"
    />
  )
}
