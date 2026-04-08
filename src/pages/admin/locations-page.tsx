import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminLocations } from '@/domains/locations/api'

const PAGE_SIZE = 12

function formatDate(value: string | null) {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminLocationsPage() {
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [page, setPage] = useState(1)

  const locationsQuery = useQuery({
    queryKey: ['locations', 'admin'],
    queryFn: fetchAdminLocations,
  })

  const locations = locationsQuery.data ?? []
  const stateOptions = useMemo(
    () => ['all', ...new Set(locations.map((location) => location.state))],
    [locations],
  )
  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return locations.filter((location) => {
      const matchesState = stateFilter === 'all' ? true : location.state === stateFilter
      const haystack = `${location.state} ${location.city}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesState && matchesQuery
    })
  }, [locations, query, stateFilter])
  const paginatedLocations = useMemo(
    () => filteredLocations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLocations, page],
  )

  const stats = useMemo(
    () => ({
      approved: locations.filter((location) => location.approvedListings > 0).length,
      states: new Set(locations.map((location) => location.state)).size,
      total: locations.length,
      withPending: locations.filter((location) => location.pendingListings > 0).length,
    }),
    [locations],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.listings}>Catalogo publico</Link>
            </Button>
          </>
        }
        description="Visao operacional das localidades derivadas do proprio catalogo do MVP, sem normalizacao extra fora de escopo."
        eyebrow="Admin / localidades"
        title="Mapa operacional de localidades"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Localidades" value={stats.total} />
        <AdminStatCard label="Estados" value={stats.states} />
        <AdminStatCard label="Com aprovados" value={stats.approved} />
        <AdminStatCard label="Com pendentes" value={stats.withPending} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setStateFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por cidade ou UF"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setStateFilter(event.target.value)
            }}
            value={stateFilter}
          >
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state === 'all' ? 'Todos os estados' : state}
              </option>
            ))}
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'UF',
            className: 'w-[90px]',
            cell: (location) => <span className="font-medium text-foreground">{location.state}</span>,
          },
          {
            header: 'Cidade',
            cell: (location) => <span className="font-medium text-foreground">{location.city}</span>,
          },
          {
            header: 'Anuncios',
            cell: (location) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{location.totalListings} total</p>
                <p>{location.approvedListings} aprovados</p>
                <p>{location.pendingListings} pendentes</p>
              </div>
            ),
          },
          {
            header: 'Ultima movimentacao',
            cell: (location) => <span className="text-sm text-muted-foreground">{formatDate(location.lastUpdatedAt)}</span>,
          },
        ]}
        data={paginatedLocations}
        emptyDescription="Nenhuma localidade corresponde aos filtros atuais."
        emptyTitle="Sem localidades neste recorte"
        errorMessage="Nao foi possivel carregar as localidades."
        getRowKey={(location) => `${location.state}-${location.city}`}
        isError={locationsQuery.isError}
        isLoading={locationsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredLocations.length}
      />
    </section>
  )
}
