import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, FileSearch } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminListings } from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'

const PAGE_SIZE = 12

function getListingStatusMeta(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'Aprovado', tone: 'success' as const }
    case 'pending_review':
      return { label: 'Em revisao', tone: 'info' as const }
    case 'rejected':
      return { label: 'Rejeitado', tone: 'danger' as const }
    case 'paused':
      return { label: 'Pausado', tone: 'warning' as const }
    case 'draft':
      return { label: 'Rascunho', tone: 'neutral' as const }
    case 'expired':
      return { label: 'Expirado', tone: 'warning' as const }
    default:
      return { label: 'Arquivado', tone: 'neutral' as const }
    }
}

export function AdminListingsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof listingStatusFilterOptions)[number]['value']>('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [page, setPage] = useState(1)

  const listingsQuery = useQuery({
    queryKey: ['listings', 'admin'],
    queryFn: () => fetchAdminListings(),
  })

  const listings = listingsQuery.data ?? []
  const stateOptions = useMemo(
    () => ['all', ...new Set(listings.map((listing) => listing.state).filter(Boolean))],
    [listings],
  )
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return listings.filter((listing) => {
      const matchesStatus = statusFilter === 'all' ? true : listing.status === statusFilter
      const matchesState = stateFilter === 'all' ? true : listing.state === stateFilter
      const haystack =
        `${listing.title} ${listing.summary ?? ''} ${listing.city} ${listing.state} ${listing.categoryName ?? ''} ${listing.materialName ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesState && matchesQuery
    })
  }, [listings, query, stateFilter, statusFilter])
  const paginatedListings = useMemo(
    () => filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredListings, page],
  )

  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      total: listings.length,
    }),
    [listings],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.root}>Visao geral</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.listings}>
                <Eye className="size-4" />
                Catalogo publico
              </Link>
            </Button>
          </>
        }
        description="Revise a fila, acompanhe status editoriais e abra o detalhe operacional de cada anuncio."
        eyebrow="Admin / anuncios"
        title="Gestao de anuncios"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Pendentes" value={stats.pending} />
        <AdminStatCard label="Aprovados" value={stats.approved} />
        <AdminStatCard label="Rejeitados" value={stats.rejected} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setStateFilter('all')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtros estruturais sempre antecedem o dataset principal de moderacao."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por titulo, resumo, localidade ou taxonomia"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as typeof statusFilter)
            }}
            value={statusFilter}
          >
            {listingStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
            header: 'Anuncio',
            cell: (listing) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.summary || listing.description}</p>
              </div>
            ),
          },
          {
            header: 'Taxonomia',
            cell: (listing) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">{listing.categoryName ?? 'Sem categoria'}</p>
                <p>{listing.materialName ?? 'Material nao informado'}</p>
              </div>
            ),
          },
          {
            header: 'Localidade',
            cell: (listing) => (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {listing.city} - {listing.state}
                </p>
                <p>{listing.contactPhone ?? 'Telefone nao informado'}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            cell: (listing) => {
              const meta = getListingStatusMeta(listing.status)
              return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
            },
          },
          {
            header: 'Atualizado',
            cell: (listing) => (
              <span className="text-sm text-muted-foreground">{formatListingDate(listing.updatedAt)}</span>
            ),
          },
          {
            header: 'Acoes',
            className: 'w-[220px] text-right',
            cell: (listing) => (
              <AdminRowActions
                actions={[
                  {
                    icon: FileSearch,
                    label: 'Detalhe',
                    to: paths.admin.listingDetails(listing.id),
                  },
                  ...(listing.slug
                    ? [
                        {
                          icon: Eye,
                          label: 'Publico',
                          to: paths.public.listingDetails(listing.slug),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
        data={paginatedListings}
        emptyDescription="Nenhum anuncio corresponde aos filtros aplicados."
        emptyTitle="Sem anuncios no recorte atual"
        errorMessage="Nao foi possivel carregar os anuncios administrativos."
        getRowKey={(listing) => listing.id}
        isError={listingsQuery.isError}
        isLoading={listingsQuery.isLoading}
        rowClassName={(listing) =>
          listing.status === 'pending_review' ? 'bg-sky-50/30' : undefined
        }
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredListings.length}
      />

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        A fila administrativa esta orientada por tabela para leitura rapida, com filtros acima do
        dataset e detalhe separado por anuncio.
      </div>
    </section>
  )
}
