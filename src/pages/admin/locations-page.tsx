import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { deleteAdminLocation, fetchAdminLocations, fetchLocationListings, upsertAdminLocation } from '@/domains/locations/api'
import type { AdminListingLocation } from '@/domains/locations/types'

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
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newState, setNewState] = useState('')
  const [newCity, setNewCity] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<AdminListingLocation | null>(null)

  const locationsQuery = useQuery({
    queryKey: ['locations', 'admin'],
    queryFn: fetchAdminLocations,
  })
  const locationListingsQuery = useQuery({
    queryKey: ['locations', 'admin', 'listings', selectedLocation?.state, selectedLocation?.city],
    queryFn: () => fetchLocationListings({ city: selectedLocation?.city ?? '', state: selectedLocation?.state ?? '' }),
    enabled: Boolean(selectedLocation),
  })

  const createMutation = useMutation({
    mutationFn: () => upsertAdminLocation({ city: newCity, state: newState }),
    onSuccess: async () => {
      setIsCreateModalOpen(false)
      setNewCity('')
      setNewState('')
      await queryClient.invalidateQueries({ queryKey: ['locations', 'admin'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (location: AdminListingLocation) =>
      deleteAdminLocation({
        city: location.city,
        state: location.state,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations', 'admin'] })
    },
  })

  const locations = useMemo(() => locationsQuery.data ?? [], [locationsQuery.data])
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
            <Button onClick={() => setIsCreateModalOpen(true)} type="button">
              Adicionar localidade
            </Button>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.listings}>Catálogo público</Link>
            </Button>
          </>
        }
        description="Visão operacional das localidades derivadas do próprio catálogo do MVP, sem normalização extra fora de escopo."
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
            header: 'Última movimentação',
            cell: (location) => <span className="text-sm text-muted-foreground">{formatDate(location.lastUpdatedAt)}</span>,
          },
          {
            header: 'Ações',
            className: 'w-[280px]',
            cell: (location) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => setSelectedLocation(location)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Ver anúncios
                </Button>
                <Button
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(location)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Remover
                </Button>
              </div>
            ),
          },
        ]}
        data={paginatedLocations}
        emptyDescription="Nenhuma localidade corresponde aos filtros atuais."
        emptyTitle="Sem localidades neste recorte"
        errorMessage="Não foi possível carregar as localidades."
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

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de localidade"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!createMutation.isPending) {
                setIsCreateModalOpen(false)
              }
            }}
            type="button"
          />
          <div className="relative w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <p className="text-sm font-semibold text-foreground">Nova localidade</p>
            <div className="mt-4 grid gap-3">
              <Input
                maxLength={2}
                onChange={(event) => setNewState(event.target.value.toUpperCase())}
                placeholder="UF"
                value={newState}
              />
              <Input
                onChange={(event) => setNewCity(event.target.value)}
                placeholder="Cidade"
                value={newCity}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={createMutation.isPending}
                onClick={() => setIsCreateModalOpen(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
                type="button"
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar localidade'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedLocation ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de anuncios"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setSelectedLocation(null)}
            type="button"
          />
          <div className="relative w-full max-w-3xl rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <p className="text-sm font-semibold text-foreground">
              Anúncios de {selectedLocation.city} - {selectedLocation.state}
            </p>
            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-border">
              {locationListingsQuery.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Carregando anúncios...</p>
              ) : locationListingsQuery.isError ? (
                <p className="p-4 text-sm text-destructive">Não foi possível carregar os anúncios desta localidade.</p>
              ) : (locationListingsQuery.data ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nenhum anúncio encontrado para esta localidade.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left">
                      <th className="px-4 py-3 font-medium text-foreground">Título</th>
                      <th className="px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="px-4 py-3 font-medium text-foreground">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(locationListingsQuery.data ?? []).map((listing) => (
                      <tr className="border-b border-border/60" key={listing.id}>
                        <td className="px-4 py-3 text-foreground">{listing.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{listing.status}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(listing.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedLocation(null)} type="button" variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
