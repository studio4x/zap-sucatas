import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ListingFilters } from '@/components/public/listing-filters'
import { ListingGrid } from '@/components/public/listing-grid'
import { ListingSortBar } from '@/components/public/listing-sort-bar'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Card, CardContent } from '@/components/ui/card'
import { fetchListingReferences, fetchPublicListings } from '@/domains/listings/api'

const sortOptions = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Mais antigos', value: 'oldest' },
  { label: 'Título A-Z', value: 'title_asc' },
  { label: 'Título Z-A', value: 'title_desc' },
  { label: 'Destaques primeiro', value: 'featured' },
]

const pageSize = 9

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoria') ?? '')
  const [materialId, setMaterialId] = useState(searchParams.get('material') ?? '')
  const [state, setState] = useState(searchParams.get('uf') ?? '')
  const [city, setCity] = useState(searchParams.get('cidade') ?? '')
  const [sort, setSort] = useState(searchParams.get('ordem') ?? 'recent')
  const [page, setPage] = useState(Number(searchParams.get('pagina') ?? '1'))

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })

  const listingsQuery = useQuery({
    queryKey: ['listings', 'public', { categoryId, city, materialId, query, state }],
    queryFn: () =>
      fetchPublicListings({
        categoryId: categoryId || undefined,
        city: city || undefined,
        primaryMaterialId: materialId || undefined,
        query: query || undefined,
        state: state || undefined,
      }),
  })

  useEffect(() => {
    const nextParams = new URLSearchParams()

    if (query.trim()) {
      nextParams.set('q', query.trim())
    }

    if (categoryId) {
      nextParams.set('categoria', categoryId)
    }

    if (materialId) {
      nextParams.set('material', materialId)
    }

    if (state) {
      nextParams.set('uf', state)
    }

    if (city.trim()) {
      nextParams.set('cidade', city.trim())
    }

    if (sort !== 'recent') {
      nextParams.set('ordem', sort)
    }

    if (page > 1) {
      nextParams.set('pagina', String(page))
    }

    setSearchParams(nextParams, { replace: true })
  }, [categoryId, city, materialId, page, query, setSearchParams, sort, state])

  useEffect(() => {
    setPage(1)
  }, [categoryId, city, materialId, query, sort, state])

  const sortedListings = useMemo(() => {
    const items = [...(listingsQuery.data ?? [])]

    switch (sort) {
      case 'oldest':
        return items.sort((left, right) => (left.publishedAt ?? '') > (right.publishedAt ?? '') ? 1 : -1)
      case 'title_asc':
        return items.sort((left, right) => left.title.localeCompare(right.title, 'pt-BR'))
      case 'title_desc':
        return items.sort((left, right) => right.title.localeCompare(left.title, 'pt-BR'))
      case 'featured':
        return items.sort((left, right) => {
          if (left.isFeatured !== right.isFeatured) {
            return left.isFeatured ? -1 : 1
          }

          return (left.publishedAt ?? '') < (right.publishedAt ?? '') ? 1 : -1
        })
      case 'recent':
      default:
        return items.sort((left, right) => (left.publishedAt ?? '') < (right.publishedAt ?? '') ? 1 : -1)
    }
  }, [listingsQuery.data, sort])

  const totalPages = Math.max(1, Math.ceil(sortedListings.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedListings = sortedListings.slice((safePage - 1) * pageSize, safePage * pageSize)

  function clearFilters() {
    setQuery('')
    setCategoryId('')
    setMaterialId('')
    setState('')
    setCity('')
    setSort('recent')
    setPage(1)
  }

  return (
    <section className="space-y-6 lg:space-y-8">
      <PublicSectionHeading
        description="Explore anúncios aprovados com filtros claros, leitura rápida e navegação pensada para quem compra ou vende no mercado de sucatas e maquinários."
        eyebrow="Catálogo público"
        title="Anúncios moderados para negociação real"
      />

      <ListingFilters
        categories={referencesQuery.data?.categories ?? []}
        categoryId={categoryId}
        city={city}
        materialId={materialId}
        materials={referencesQuery.data?.materials ?? []}
        onCategoryChange={setCategoryId}
        onCityChange={setCity}
        onClear={clearFilters}
        onMaterialChange={setMaterialId}
        onQueryChange={setQuery}
        onStateChange={setState}
        query={query}
        state={state}
      />

      <ListingSortBar
        onChange={setSort}
        options={sortOptions}
        resultLabel={`${sortedListings.length} anúncio${sortedListings.length === 1 ? '' : 's'} encontrado${sortedListings.length === 1 ? '' : 's'}`}
        value={sort}
      />

      {listingsQuery.isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando catálogo público...
          </CardContent>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os anúncios públicos neste momento.
          </CardContent>
        </Card>
      ) : null}

      {!listingsQuery.isLoading ? (
        <ListingGrid
          emptyDescription="Ajuste a busca ou limpe os filtros para encontrar outros lotes, materiais e equipamentos já aprovados."
          emptyTitle="Nenhum anúncio encontrado"
          listings={paginatedListings}
        />
      ) : null}

      {sortedListings.length > pageSize ? (
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-card/85 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Página {safePage} de {totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
