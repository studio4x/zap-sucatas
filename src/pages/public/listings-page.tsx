import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ListingFilters } from '@/components/public/listing-filters'
import { ListingGrid } from '@/components/public/listing-grid'
import { ListingSortBar } from '@/components/public/listing-sort-bar'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fetchListingReferences, fetchPublicListingsPage } from '@/domains/listings/api'
import type { PublicListingSort } from '@/domains/listings/types'

const sortOptions = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Mais antigos', value: 'oldest' },
  { label: 'Titulo A-Z', value: 'title_asc' },
  { label: 'Titulo Z-A', value: 'title_desc' },
  { label: 'Destaques primeiro', value: 'featured' },
]

const PAGE_SIZE = 9

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoria') ?? '')
  const [materialId, setMaterialId] = useState(searchParams.get('material') ?? '')
  const [state, setState] = useState(searchParams.get('uf') ?? '')
  const [city, setCity] = useState(searchParams.get('cidade') ?? '')
  const [sort, setSort] = useState<PublicListingSort>((searchParams.get('ordem') as PublicListingSort) ?? 'recent')
  const [page, setPage] = useState(Number(searchParams.get('pagina') ?? '1'))
  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })

  const listingsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['listings', 'public', 'page', { categoryId, city, materialId, page: normalizedPage, query, sort, state }],
    queryFn: () =>
      fetchPublicListingsPage({
        categoryId: categoryId || undefined,
        city: city || undefined,
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        primaryMaterialId: materialId || undefined,
        query: query || undefined,
        sort,
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

    if (normalizedPage > 1) {
      nextParams.set('pagina', String(normalizedPage))
    }

    setSearchParams(nextParams, { replace: true })
  }, [categoryId, city, materialId, normalizedPage, query, setSearchParams, sort, state])

  const listings = listingsQuery.data?.items ?? []
  const totalCount = listingsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const activeFiltersCount = [query.trim(), categoryId, materialId, state, city.trim()].filter(Boolean).length

  const highlightedNumbers = useMemo(
    () => [
      {
        label: 'Anuncios no recorte',
        value: totalCount,
      },
      {
        label: 'Categorias ativas',
        value: referencesQuery.data?.categories.length ?? 0,
      },
      {
        label: 'Materiais no filtro',
        value: referencesQuery.data?.materials.length ?? 0,
      },
    ],
    [referencesQuery.data?.categories.length, referencesQuery.data?.materials.length, totalCount],
  )

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
      <div className="overflow-hidden rounded-[2.25rem] border border-[#d7e2d7] bg-[linear-gradient(180deg,#f6faf5_0%,#eef4ef_100%)]">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              description="Catalogo moderado para negociacao real, com foco em busca, filtragem setorial e leitura comercial rapida."
              eyebrow="Catalogo publico"
              title="Anúncios de sucatas e metais com estrutura de marketplace"
            />
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Moderacao antes da publicacao
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Busca por categoria, material e localidade
              </Badge>
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Paginas de anuncio com contexto comercial
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {highlightedNumbers.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/80 bg-white/88 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ListingFilters
        categories={referencesQuery.data?.categories ?? []}
        categoryId={categoryId}
        city={city}
        materialId={materialId}
        materials={referencesQuery.data?.materials ?? []}
        onCategoryChange={(value) => {
          setPage(1)
          setCategoryId(value)
        }}
        onCityChange={(value) => {
          setPage(1)
          setCity(value)
        }}
        onClear={clearFilters}
        onMaterialChange={(value) => {
          setPage(1)
          setMaterialId(value)
        }}
        onQueryChange={(value) => {
          setPage(1)
          setQuery(value)
        }}
        onStateChange={(value) => {
          setPage(1)
          setState(value)
        }}
        query={query}
        state={state}
      />

      <ListingSortBar
        onChange={(value) => {
          setPage(1)
          setSort(value as PublicListingSort)
        }}
        options={sortOptions}
        resultLabel={`${totalCount} anuncio${totalCount === 1 ? '' : 's'} neste recorte${activeFiltersCount > 0 ? ` • ${activeFiltersCount} filtro${activeFiltersCount === 1 ? '' : 's'} ativo${activeFiltersCount === 1 ? '' : 's'}` : ''}`}
        value={sort}
      />

      {listingsQuery.isLoading ? (
        <Card className="rounded-[1.8rem] border-border/80">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando catalogo publico...
          </CardContent>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="rounded-[1.8rem] border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Nao foi possivel carregar os anuncios publicos neste momento.
          </CardContent>
        </Card>
      ) : null}

      {!listingsQuery.isLoading ? (
        <ListingGrid
          emptyDescription="Ajuste a busca ou limpe os filtros para encontrar outros lotes e materiais aprovados."
          emptyTitle="Nenhum anuncio encontrado"
          listings={listings}
        />
      ) : null}

      {totalCount > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 rounded-[1.7rem] border border-border bg-card/88 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {normalizedPage} de {totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-[1.1rem] border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={normalizedPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-[1.1rem] border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={normalizedPage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Proxima
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
