import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function ListingDetailsPage() {
  return (
    <PagePlaceholder
      description="Detalhe do anuncio com galeria, ficha tecnica, descricao completa, localizacao, dados comerciais, perguntas e relacionados."
      eyebrow="Anuncio"
      highlights={[
        'Galeria de imagens do storage',
        'Ficha tecnica e atributos dinamicos',
        'Q&A publico controlado por moderacao',
      ]}
      title="Detalhe publico do anuncio"
    />
  )
}
