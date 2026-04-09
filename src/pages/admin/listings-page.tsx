import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, FilePlus2, FileSearch, Pencil, Trash2 } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { archiveListing, fetchAdminListings } from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'

const PAGE_SIZE = 12

function getListingStatusMeta(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'Aprovado', tone: 'success' as const }
    case 'pending_review':
      return { label: 'Em revisão', tone: 'info' as const }
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
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof listingStatusFilterOptions)[number]['value']>('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' | 'warning' } | null>(null)

  const listingsQuery = useQuery({
    queryKey: ['listings', 'admin'],
    queryFn: () => fetchAdminListings(),
  })

  const archiveMutation = useMutation({
    mutationFn: async (listingIds: string[]) => {
      for (const listingId of listingIds) {
        await archiveListing(listingId)
      }
    },
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível remover os anúncios selecionados.',
        tone: 'error',
      })
    },
    onSuccess: async (_, listingIds) => {
      setFeedback({
        message:
          listingIds.length === 1
            ? 'Anúncio removido da operação com sucesso.'
            : `${listingIds.length} anúncios removidos da operação com sucesso.`,
        tone: 'warning',
      })
      setSelectedIds([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])
    },
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
  const selectableListings = useMemo(
    () => filteredListings.filter((listing) => listing.status !== 'archived'),
    [filteredListings],
  )
  const selectedCount = selectedIds.length
  const allSelectableChecked =
    selectableListings.length > 0 && selectableListings.every((listing) => selectedIds.includes(listing.id))

  function toggleSelection(listingId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(listingId)
          ? current
          : [...current, listingId]
        : current.filter((id) => id !== listingId),
    )
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? selectableListings.map((listing) => listing.id) : [])
  }

  function handleArchiveSelection(listingIds: string[]) {
    if (listingIds.length === 0) {
      return
    }

    const confirmed = window.confirm(
      listingIds.length === 1
        ? 'Remover este anúncio da operação pública? Ele será arquivado e permanecerá apenas no histórico interno.'
        : `Remover ${listingIds.length} anúncios da operação pública? Eles serão arquivados e permanecerão apenas no histórico interno.`,
    )

    if (!confirmed) {
      return
    }

    setFeedback(null)
    archiveMutation.mutate(listingIds)
  }

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
              <Link to={paths.admin.newListing}>
                <FilePlus2 className="size-4" />
                Novo anúncio
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.root}>Visão geral</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.listings}>
                <Eye className="size-4" />
                Catálogo público
              </Link>
            </Button>
          </>
        }
        description="Revise a fila, acompanhe status editoriais e remova da operação os anúncios que precisarem sair do catálogo."
        eyebrow="Admin / anúncios"
        title="Gestão de anúncios"
      />

      {feedback ? (
        <DashboardAlertCard
          description={feedback.message}
          title={feedback.tone === 'error' ? 'Ajuste necessário' : 'Operação concluída'}
          tone={feedback.tone}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Pendentes" value={stats.pending} />
        <AdminStatCard label="Aprovados" value={stats.approved} />
        <AdminStatCard label="Rejeitados" value={stats.rejected} />
      </div>

      <AdminFilterCard
        actions={
          <>
            {selectedCount > 0 ? (
              <Button
                disabled={archiveMutation.isPending}
                onClick={() => handleArchiveSelection(selectedIds)}
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
                {archiveMutation.isPending ? 'Removendo...' : `Remover selecionados (${selectedCount})`}
              </Button>
            ) : null}
            <Button
              onClick={() => {
                setPage(1)
                setQuery('')
                setSelectedIds([])
                setStateFilter('all')
                setStatusFilter('all')
              }}
              type="button"
              variant="outline"
            >
              Limpar filtros
            </Button>
          </>
        }
        description="Filtros estruturais sempre antecedem o dataset principal de moderação."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por título, resumo, localidade ou taxonomia"
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
            header: 'Seleção',
            className: 'w-[72px]',
            cell: (listing) =>
              listing.status === 'archived' ? null : (
                <input
                  aria-label={`Selecionar anúncio ${listing.title}`}
                  checked={selectedIds.includes(listing.id)}
                  className="size-4 rounded border border-border"
                  onChange={(event) => toggleSelection(listing.id, event.target.checked)}
                  type="checkbox"
                />
              ),
          },
          {
            header: 'Anúncio',
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
                <p>{listing.materialName ?? 'Material não informado'}</p>
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
                <p>{listing.contactPhone ?? 'Telefone não informado'}</p>
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
            header: (
              <div className="flex justify-end">
                <input
                  aria-label="Selecionar todos os anúncios filtrados"
                  checked={allSelectableChecked}
                  className="size-4 rounded border border-border"
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  type="checkbox"
                />
              </div>
            ) as unknown as string,
            className: 'w-[300px] text-right',
            cell: (listing) => (
              <AdminRowActions
                actions={[
                  {
                    icon: Pencil,
                    label: 'Editar',
                    to: paths.admin.editListing(listing.id),
                  },
                  {
                    icon: FileSearch,
                    label: 'Detalhe',
                    to: paths.admin.listingDetails(listing.id),
                  },
                  ...(listing.status !== 'archived'
                    ? [
                        {
                          icon: Trash2,
                          label: 'Remover',
                          onClick: () => handleArchiveSelection([listing.id]),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                  ...(listing.slug && listing.status === 'approved'
                    ? [
                        {
                          icon: Eye,
                          label: 'Público',
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
        emptyDescription="Nenhum anúncio corresponde aos filtros aplicados."
        emptyTitle="Sem anúncios no recorte atual"
        errorMessage="Não foi possível carregar os anúncios administrativos."
        getRowKey={(listing) => listing.id}
        isError={listingsQuery.isError}
        isLoading={listingsQuery.isLoading}
        rowClassName={(listing) => (listing.status === 'pending_review' ? 'bg-sky-50/30' : undefined)}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredListings.length}
      />

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        A fila administrativa está orientada por tabela para leitura rápida, com filtros acima do dataset e remoção lógica por arquivamento.
      </div>
    </section>
  )
}
