import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ListingGrid } from '@/components/public/listing-grid'
import { ListingSidebarCard } from '@/components/public/listing-sidebar-card'
import { ListingSortBar } from '@/components/public/listing-sort-bar'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { FeaturedListingsSection } from '@/components/public/featured-listings-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { buildCategoryTree, collectCategoryAndDescendantIds } from '@/domains/categories/utils'
import { fetchFeaturedPublicListings, fetchListingReferences, fetchPublicListingsPage } from '@/domains/listings/api'
import type { PublicListingSort } from '@/domains/listings/types'
import { useSystemSettings } from '@/hooks/use-system-settings'

const sortOptions = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Mais antigos', value: 'oldest' },
  { label: 'Título A-Z', value: 'title_asc' },
  { label: 'Título Z-A', value: 'title_desc' },
  { label: 'Destaques primeiro', value: 'featured' },
]

const PAGE_SIZE = 9

export function ListingsPage() {
  const { featuredPaymentsEnabled } = useSystemSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoria') ?? '')
  const [state, setState] = useState(searchParams.get('uf') ?? '')
  const [city, setCity] = useState(searchParams.get('cidade') ?? '')
  const [sort, setSort] = useState<PublicListingSort>((searchParams.get('ordem') as PublicListingSort) ?? 'recent')
  const [page, setPage] = useState(Number(searchParams.get('página') ?? '1'))
  const catalogSectionRef = useRef<HTMLDivElement | null>(null)
  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })
  const categoryTree = useMemo(
    () => buildCategoryTree(referencesQuery.data?.categories ?? []),
    [referencesQuery.data?.categories],
  )
  const selectedCategoryIds = useMemo(
    () => {
      if (!categoryId) {
        return []
      }

      const ids = collectCategoryAndDescendantIds(categoryTree, categoryId)
      return ids.length > 0 ? ids : [categoryId]
    },
    [categoryId, categoryTree],
  )

  const listingsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['listings', 'public', 'page', { categoryId, city, page: normalizedPage, query, sort, state }],
    queryFn: () =>
      fetchPublicListingsPage({
        categoryId: categoryId || undefined,
        city: city || undefined,
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        query: query || undefined,
        sort,
        state: state || undefined,
      }),
  })

  const featuredListingsQuery = useQuery({
    enabled: featuredPaymentsEnabled,
    queryKey: ['listings', 'public', 'featured', { categoryId, city, descendantIds: selectedCategoryIds.join(','), state }],
    queryFn: async () => {
      const featured = await fetchFeaturedPublicListings(6)
      return featured.filter((listing) => {
        if (categoryId && !selectedCategoryIds.includes(listing.categoryId)) {
          return false
        }

        if (state && listing.state.toUpperCase() !== state.toUpperCase()) {
          return false
        }

        if (city && listing.city.toLowerCase() !== city.trim().toLowerCase()) {
          return false
        }

        return true
      })
    },
  })

  useEffect(() => {
    const nextParams = new URLSearchParams()

    if (query.trim()) {
      nextParams.set('q', query.trim())
    }

    if (categoryId) {
      nextParams.set('categoria', categoryId)
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
      nextParams.set('página', String(normalizedPage))
    }

    setSearchParams(nextParams, { replace: true })
  }, [categoryId, city, normalizedPage, query, setSearchParams, sort, state])

  const listings = listingsQuery.data?.items ?? []
  const totalCount = listingsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const activeFiltersCount = [query.trim(), categoryId, state, city.trim()].filter(Boolean).length
  const hasSearchQuery = query.trim().length > 0

  const visibleCities = useMemo(() => {
    if (!state) {
      return []
    }

    return referencesQuery.data?.stateCityMap?.[state] ?? []
  }, [referencesQuery.data?.stateCityMap, state])

  useEffect(() => {
    if (!state) {
      if (city) {
        setCity('')
      }
      return
    }

    if (city && !visibleCities.some((item) => item.toLowerCase() === city.toLowerCase())) {
      setCity('')
    }
  }, [city, state, visibleCities])

  return (
    <section className="space-y-6 lg:space-y-8">
      <div className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(180deg,#f6faf5_0%,#eef4ef_100%)] px-5 py-6 shadow-[0_20px_48px_-36px_rgba(19,33,23,0.3)] md:px-6 lg:px-8 lg:py-8">
        <PublicSectionHeading
          description="Encontre anúncios por categoria, localidade e material."
          eyebrow="Catálogo público"
          title="Anúncios de sucatas e metais"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="sticky top-20 space-y-4 self-start">
          <div className="rounded-[1.25rem] bg-white/95 p-3 shadow-[0_18px_45px_-36px_rgba(19,33,23,0.4)] backdrop-blur">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 rounded-[1rem] border-[#d5e1d5] bg-white pl-12 pr-4"
                onChange={(event) => {
                  setPage(1)
                  setQuery(event.target.value)
                }}
                placeholder="Busque por material, sucata, maquina, lote, resumo ou cidade"
                value={query}
              />
            </div>
          </div>

          <ListingSidebarCard title="Categorias">
            <div className="flex flex-col gap-2">
              <Button
                className="justify-start"
                onClick={() => {
                  setPage(1)
                  setCategoryId('')
                }}
                type="button"
                variant={categoryId ? 'outline' : 'default'}
              >
                Todas as categorias
              </Button>
              {categoryTree.map((category) => (
                <div key={category.id} className="space-y-2">
                  <Button
                    className="justify-start"
                    onClick={() => {
                      setPage(1)
                      setCategoryId(category.id)
                    }}
                    type="button"
                    variant={selectedCategoryIds.includes(category.id) ? 'default' : 'outline'}
                  >
                    {category.name}
                  </Button>
                  {category.children.length > 0 ? (
                    <div className="space-y-2 pl-3">
                      {category.children.map((child) => (
                        <Button
                          className="justify-start text-xs"
                          key={child.id}
                          onClick={() => {
                            setPage(1)
                            setCategoryId(child.id)
                          }}
                          type="button"
                          variant={categoryId === child.id ? 'default' : 'outline'}
                        >
                          {child.name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ListingSidebarCard>

          <ListingSidebarCard title="Estados">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setPage(1)
                  setState('')
                  setCity('')
                }}
                type="button"
                variant={state ? 'outline' : 'default'}
              >
                Todos
              </Button>
              {(referencesQuery.data?.states ?? []).map((uf) => (
                <Button
                  key={uf}
                  onClick={() => {
                    setPage(1)
                    setState(uf)
                    setCity('')
                  }}
                  type="button"
                  variant={state === uf ? 'default' : 'outline'}
                >
                  {uf}
                </Button>
              ))}
            </div>
          </ListingSidebarCard>

          <ListingSidebarCard title="Cidades">
            <div className="flex flex-col gap-2">
              <Button
                className="justify-start"
                disabled={!state}
                onClick={() => {
                  setPage(1)
                  setCity('')
                }}
                type="button"
                variant={city ? 'outline' : 'default'}
              >
                {!state ? 'Selecione um estado' : 'Todas as cidades'}
              </Button>
              {visibleCities.slice(0, 20).map((cityItem) => (
                <Button
                  className="justify-start"
                  key={cityItem}
                  onClick={() => {
                    setPage(1)
                    setCity(cityItem)
                  }}
                  type="button"
                  variant={city.toLowerCase() === cityItem.toLowerCase() ? 'default' : 'outline'}
                >
                  {cityItem}
                </Button>
              ))}
            </div>
          </ListingSidebarCard>
        </aside>

        <div className="space-y-6">
          {!hasSearchQuery && featuredPaymentsEnabled && featuredListingsQuery.data?.length ? (
            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#fff9ec_0%,#fff3d6_100%)] p-5 shadow-[0_26px_55px_-42px_rgba(168,111,0,0.45)] md:p-6">
              <FeaturedListingsSection
                description="Anúncios com maior prioridade de exibição no catálogo."
                listings={featuredListingsQuery.data}
                onViewAllClick={() => {
                  catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                title="Anúncios em destaque"
              />
            </div>
          ) : null}

          <div ref={catalogSectionRef}>
            <ListingSortBar
              onChange={(value) => {
                setPage(1)
                setSort(value as PublicListingSort)
              }}
              options={sortOptions}
              resultLabel={`${totalCount} anúncio${totalCount === 1 ? '' : 's'} neste recorte${activeFiltersCount > 0 ? ` • ${activeFiltersCount} filtro${activeFiltersCount === 1 ? '' : 's'} ativo${activeFiltersCount === 1 ? '' : 's'}` : ''}`}
              value={sort}
            />
          </div>

          {listingsQuery.isLoading ? (
            <Card className="rounded-[1.8rem] border-0">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Carregando catálogo público...
              </CardContent>
            </Card>
          ) : null}

          {listingsQuery.isError ? (
            <Card className="rounded-[1.8rem] border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 text-sm text-destructive">
                Não foi possível carregar os anúncios públicos neste momento.
              </CardContent>
            </Card>
          ) : null}

          {!listingsQuery.isLoading ? (
            <ListingGrid
              emptyDescription="Ajuste a busca ou limpe os filtros para encontrar outros lotes e materiais aprovados."
              emptyTitle="Nenhum anúncio encontrado"
              listings={listings}
            />
          ) : null}

          {totalCount > PAGE_SIZE ? (
            <div className="flex flex-col gap-3 rounded-[1.7rem] bg-card/88 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {normalizedPage} de {totalPages}
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
                  Próxima
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </section>
  )
}
