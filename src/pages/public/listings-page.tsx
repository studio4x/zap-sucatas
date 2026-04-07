import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function ListingsPage() {
  return (
    <PagePlaceholder
      description="Catalogo publico do marketplace com busca por termo, filtros por categoria, material, estado e cidade, ordenacao e paginacao."
      eyebrow="Catalogo"
      highlights={[
        'Busca e filtros logo no topo',
        'Cards de anuncio preparados para dados reais',
        'Leitura publica apenas para anuncios aprovados',
      ]}
      title="Listagem publica de anuncios"
    />
  )
}
