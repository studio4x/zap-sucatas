import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppNewListingPage() {
  return (
    <PagePlaceholder
      description="Tela base de criacao do anuncio com dados principais, atributos, localizacao e upload de imagens."
      eyebrow="Novo anuncio"
      highlights={[
        'Formulario em blocos',
        'Upload para bucket dedicado',
        'Preparado para salvar rascunho ou enviar',
      ]}
      title="Criar anuncio"
    />
  )
}
