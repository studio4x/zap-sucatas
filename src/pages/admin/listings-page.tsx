import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FilePlus2, FileSearch, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminFeaturedPayments } from '@/domains/featured-payments/api'
import type { AdminFeaturedPaymentItem } from '@/domains/featured-payments/types'
import {
  archiveListing,
  fetchAdminListingStateOptions,
  fetchAdminListingStats,
  fetchAdminListingsPage,
} from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

const PAGE_SIZE = 12
const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

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
  const { clearFeedback, feedback, setErrorFeedback, setWarningFeedback } = useOperationFeedback()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof listingStatusFilterOptions)[number]['value']>('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [idsPendingArchive, setIdsPendingArchive] = useState<string[]>([])
  const [archiveDialogDescription, setArchiveDialogDescription] = useState('')

  const listingsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['listings', 'admin', 'page', { page, query, stateFilter, statusFilter }],
    queryFn: () =>
      fetchAdminListingsPage({
        page,
        pageSize: PAGE_SIZE,
        query,
        state: stateFilter,
        status: statusFilter,
      }),
  })

  const stateOptionsQuery = useQuery({
    queryKey: ['listings', 'admin', 'states'],
    queryFn: fetchAdminListingStateOptions,
  })

  const statsQuery = useQuery({
    queryKey: ['listings', 'admin', 'stats'],
    queryFn: fetchAdminListingStats,
  })
  const featuredPaymentsQuery = useQuery({
    queryKey: ['featured-payments', 'admin'],
    queryFn: fetchAdminFeaturedPayments,
  })

  const archiveMutation = useMutation({
    mutationFn: async (listingIds: string[]) => {
      for (const listingId of listingIds) {
        await archiveListing(listingId)
      }
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível remover os anúncios selecionados.')
    },
    onSuccess: async (_, listingIds) => {
      setWarningFeedback(
        listingIds.length === 1
          ? 'Anúncio removido da operação com sucesso.'
          : `${listingIds.length} anúncios removidos da operação com sucesso.`,
      )
      setIdsPendingArchive([])
      setSelectedIds([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin', 'stats'] }),
      ])
    },
  })

  const listings = useMemo(() => listingsQuery.data?.items ?? [], [listingsQuery.data])
  const totalCount = listingsQuery.data?.totalCount ?? 0
  const stateOptions = useMemo(
    () => ['all', ...(stateOptionsQuery.data ?? [])],
    [stateOptionsQuery.data],
  )
  const stats = useMemo(
    () =>
      statsQuery.data ?? {
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0,
      },
    [statsQuery.data],
  )
  const latestPaymentByListingId = useMemo(() => {
    const map = new Map<string, AdminFeaturedPaymentItem>()

    for (const payment of featuredPaymentsQuery.data ?? []) {
      const current = map.get(payment.listing.id)
      if (!current) {
        map.set(payment.listing.id, payment)
        continue
      }

      if (new Date(payment.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        map.set(payment.listing.id, payment)
      }
    }

    return map
  }, [featuredPaymentsQuery.data])

  const selectableListings = useMemo(
    () => listings.filter((listing) => listing.status !== 'archived'),
    [listings],
  )
  const effectiveSelectedIds = useMemo(
    () => selectedIds.filter((id) => listings.some((listing) => listing.id === id)),
    [listings, selectedIds],
  )
  const selectedCount = effectiveSelectedIds.length
  const allSelectableChecked =
    selectableListings.length > 0 &&
    selectableListings.every((listing) => effectiveSelectedIds.includes(listing.id))

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

  function requestArchive(listingIds: string[], description: string) {
    if (listingIds.length === 0) {
      return
    }

    clearFeedback()
    setArchiveDialogDescription(description)
    setIdsPendingArchive(listingIds)
  }

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

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

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
                onClick={() =>
                  requestArchive(
                    effectiveSelectedIds,
                    effectiveSelectedIds.length === 1
                      ? 'Remover este anúncio da operação pública? Ele será arquivado e permanecerá apenas no histórico interno.'
                      : `Remover ${effectiveSelectedIds.length} anúncios da operação pública? Eles serão arquivados e permanecerão apenas no histórico interno.`,
                  )
                }
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
            header: (
              <div className="flex items-center">
                <input
                  aria-label="Selecionar todos os anúncios da página"
                  checked={allSelectableChecked}
                  className="size-4 rounded border border-border"
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  type="checkbox"
                />
              </div>
            ) as unknown as string,
            className: 'w-[72px]',
            cell: (listing) =>
              listing.status === 'archived' ? null : (
                <input
                  aria-label={`Selecionar anúncio ${listing.title}`}
                  checked={effectiveSelectedIds.includes(listing.id)}
                  className="size-4 rounded border border-border"
                  onChange={(event) => toggleSelection(listing.id, event.target.checked)}
                  type="checkbox"
                />
              ),
          },
          {
            header: 'Anúncio',
            className: 'w-[280px]',
            cell: (listing) => (
              <div className="max-w-[280px] space-y-1">
                <p className="line-clamp-2 font-medium text-foreground">{listing.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{listing.summary || listing.description}</p>
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
            header: 'Destaque',
            cell: (listing) => (
              <div className="space-y-1 text-xs">
                <p className={listing.isFeatured ? 'font-semibold text-emerald-700' : 'text-muted-foreground'}>
                  {listing.isFeatured ? 'Ativo' : 'Inativo'}
                </p>
                {latestPaymentByListingId.get(listing.id) ? (
                  <p className="text-muted-foreground">
                    {latestPaymentByListingId.get(listing.id)?.status === 'paid'
                      ? 'Pagamento confirmado'
                      : 'Pagamento pendente'}{' '}
                    • {BRL_FORMATTER.format(latestPaymentByListingId.get(listing.id)?.amount ?? 0)}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Sem pagamento de destaque</p>
                )}
              </div>
            ),
          },
          {
            header: 'Atualizado',
            cell: (listing) => (
              <span className="text-sm text-muted-foreground">{formatListingDate(listing.updatedAt)}</span>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[144px] text-right',
            cell: (listing) => (
              <AdminRowActions
                compact
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
                          onClick: () =>
                            requestArchive(
                              [listing.id],
                              `Remover o anúncio "${listing.title}" da operação pública? Ele será arquivado e permanecerá apenas no histórico interno.`,
                            ),
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
        data={listings}
        emptyDescription="Nenhum anúncio corresponde aos filtros aplicados."
        emptyTitle="Sem anúncios no recorte atual"
        errorMessage="Não foi possível carregar os anúncios administrativos."
        getRowKey={(listing) => listing.id}
        isError={
          listingsQuery.isError ||
          stateOptionsQuery.isError ||
          statsQuery.isError ||
          featuredPaymentsQuery.isError
        }
        isLoading={
          listingsQuery.isLoading ||
          stateOptionsQuery.isLoading ||
          statsQuery.isLoading ||
          featuredPaymentsQuery.isLoading
        }
        rowClassName={(listing) => (listing.status === 'pending_review' ? 'bg-sky-50/30' : undefined)}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        A fila administrativa agora pagina no servidor para reduzir custo de leitura em bases maiores.
      </div>

      <ConfirmActionDialog
        confirmLabel={idsPendingArchive.length > 1 ? 'Remover anúncios' : 'Remover anúncio'}
        description={archiveDialogDescription}
        isPending={archiveMutation.isPending}
        onConfirm={() => {
          if (idsPendingArchive.length === 0) {
            return
          }

          archiveMutation.mutate(idsPendingArchive)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setIdsPendingArchive([])
            setArchiveDialogDescription('')
          }
        }}
        open={idsPendingArchive.length > 0}
        title="Confirmar remoção"
        tone="default"
      />
    </section>
  )
}
