import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Eye, FilePlus2, PauseCircle, SendHorizontal, Star } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { DashboardFilterCard } from '@/components/dashboard/dashboard-filter-card'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardTableCard } from '@/components/dashboard/dashboard-table-card'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  archiveListing,
  createFeaturedListingPayment,
  fetchUserListings,
  listFeaturedListingPayments,
  pauseListing,
  submitListingForReview,
} from '@/domains/listings/api'
import type { ListingFeaturedPaymentSummary } from '@/domains/listings/types'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSystemSettings } from '@/hooks/use-system-settings'

type AppListingsStatusFilter = (typeof listingStatusFilterOptions)[number]['value']

type FeedbackState = {
  message: string
  tone: 'error' | 'success' | 'warning'
}

type ReviewSubmissionState = {
  reviewSubmission?: {
    listingId: string
    listingTitle: string
  }
}

export function AppListingsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { featuredPaymentsEnabled } = useSystemSettings()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppListingsStatusFilter>('all')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [reviewSubmissionModal, setReviewSubmissionModal] = useState<{
    listingId: string
    listingTitle: string
  } | null>(null)
  const [listingPendingArchive, setListingPendingArchive] = useState<{ id: string; title: string } | null>(
    null,
  )

  const listingsQuery = useQuery({
    queryKey: ['listings', 'owner', user?.profileId],
    queryFn: () => fetchUserListings(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })
  const featuredPaymentsQuery = useQuery({
    queryKey: ['listing-featured-payments', 'owner', user?.profileId],
    queryFn: listFeaturedListingPayments,
    enabled: Boolean(user?.profileId),
  })

  async function invalidateListings() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user?.profileId] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
    ])
  }

  const submitMutation = useMutation({
    mutationFn: submitListingForReview,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível enviar o anúncio para análise.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Anúncio enviado para análise com sucesso.',
        tone: 'success',
      })
      await invalidateListings()
    },
  })

  const pauseMutation = useMutation({
    mutationFn: pauseListing,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível pausar o anúncio agora.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Anúncio pausado com sucesso.',
        tone: 'success',
      })
      await invalidateListings()
    },
  })

  const archiveMutation = useMutation({
    mutationFn: archiveListing,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível arquivar o anúncio agora.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Anúncio arquivado com sucesso.',
        tone: 'warning',
      })
      await invalidateListings()
      setListingPendingArchive(null)
    },
  })
  const createFeaturedPaymentMutation = useMutation({
    mutationFn: createFeaturedListingPayment,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível gerar a cobrança de destaque.',
        tone: 'error',
      })
    },
    onSuccess: async (payload) => {
      setFeedback({
        message: payload.payment.invoiceUrl
          ? 'Cobrança de destaque gerada. Abra o link para concluir o pagamento.'
          : 'Cobrança de destaque gerada com sucesso.',
        tone: 'success',
      })

      if (payload.payment.invoiceUrl) {
        window.open(payload.payment.invoiceUrl, '_blank', 'noopener,noreferrer')
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing-featured-payments', 'owner', user?.profileId] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user?.profileId] }),
      ])
    },
  })

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data])
  const featuredPaymentByListingId = useMemo(() => {
    const map = new Map<string, ListingFeaturedPaymentSummary>()
    ;(featuredPaymentsQuery.data ?? []).forEach((payment) => {
      map.set(payment.listingId, payment)
    })
    return map
  }, [featuredPaymentsQuery.data])
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return listings.filter((listing) => {
      const matchesStatus = statusFilter === 'all' ? true : listing.status === statusFilter
      const haystack = `${listing.title} ${listing.summary ?? ''} ${listing.city} ${listing.state}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [listings, query, statusFilter])

  const requiresAttention = listings.find(
    (listing) => listing.status === 'rejected' || listing.status === 'draft',
  )
  const isBusy =
    submitMutation.isPending ||
    pauseMutation.isPending ||
    archiveMutation.isPending ||
    createFeaturedPaymentMutation.isPending

  useEffect(() => {
    const routeState = location.state as ReviewSubmissionState | null
    const reviewSubmission = routeState?.reviewSubmission
    if (!reviewSubmission) {
      return
    }

    setReviewSubmissionModal(reviewSubmission)
    navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        action={
          <Button asChild type="button">
            <Link to={paths.app.newListing}>
              <FilePlus2 className="size-4" />
              Novo anúncio
            </Link>
          </Button>
        }
        description="Gerencie seus anúncios em um único lugar, veja o que está em rascunho, em análise ou já publicado."
        title="Meus anúncios"
      />

      {requiresAttention ? (
        <DashboardAlertCard
          action={
            <Button asChild size="sm" type="button" variant="outline">
              <Link to={paths.app.editListing(requiresAttention.id)}>Abrir anúncio</Link>
            </Button>
          }
          description={
            requiresAttention.status === 'rejected'
              ? 'Existe um anúncio que precisa de correção. Revise o motivo, ajuste o conteúdo e envie novamente.'
              : 'Você ainda tem rascunhos para concluir. Complete o que faltar e envie quando estiver pronto.'
          }
          title={
            requiresAttention.status === 'rejected'
              ? 'Existe um anúncio para ajustar'
              : 'Você ainda tem rascunhos para finalizar'
          }
          tone="warning"
        />
      ) : null}

      {feedback ? (
        <DashboardAlertCard
          description={feedback.message}
          title={
            feedback.tone === 'error'
              ? 'Operação não concluída'
              : feedback.tone === 'warning'
                ? 'Anúncio arquivado'
                : 'Operação concluída'
          }
          tone={feedback.tone}
        />
      ) : null}

      <DashboardFilterCard
        actions={
          <Button
            onClick={() => {
              setQuery('')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Use a busca e os filtros para encontrar um anúncio pelo título, cidade ou resumo."
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, cidade ou resumo"
            value={query}
          />
          <Select
            onChange={(event) => setStatusFilter(event.target.value as AppListingsStatusFilter)}
            value={statusFilter}
          >
            {listingStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </DashboardFilterCard>

      {listingsQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
          Carregando seus anúncios...
        </div>
      ) : null}

      {listingsQuery.isError ? (
        <DashboardAlertCard
          description="Não conseguimos carregar seus anúncios agora."
          title="Não foi possível abrir a lista"
          tone="error"
        />
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError && filteredListings.length === 0 ? (
        <DashboardEmptyState
          action={
            <Button asChild type="button">
              <Link to={paths.app.newListing}>Criar anúncio</Link>
            </Button>
          }
          description="Ajuste os filtros ou crie seu primeiro anúncio para começar."
          title="Nenhum anúncio encontrado"
        />
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError && filteredListings.length > 0 ? (
        <DashboardTableCard
          columns={[
            {
              header: 'Anúncio',
              cell: (listing) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{listing.title}</p>
                    {listing.isFeatured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Star className="size-3.5" />
                        Destaque ativo
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{listing.summary || listing.description}</p>
                </div>
              ),
            },
            {
              header: 'Status',
              className: 'w-[150px]',
              cell: (listing) => <ListingStatusBadge status={listing.status} />,
            },
            {
              header: 'Contexto',
              className: 'w-[220px]',
              cell: (listing) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {listing.city} - {listing.state}
                  </p>
                  <p>Atualizado em {formatListingDate(listing.updatedAt)}</p>
                </div>
              ),
            },
            {
              header: 'Ações',
              className: 'w-[360px] text-right',
              cell: (listing) => {
                const canSubmit =
                  listing.status === 'draft' || listing.status === 'rejected' || listing.status === 'paused'
                const canEdit = listing.status !== 'archived'
                const canPause = listing.status === 'approved'
                const canArchive = listing.status !== 'archived'
                const latestFeaturedPayment = featuredPaymentByListingId.get(listing.id)
                const hasPendingFeaturedPayment = latestFeaturedPayment?.status === 'pending'
                const canRequestFeaturedPayment =
                  featuredPaymentsEnabled && listing.status === 'approved' && !listing.isFeatured

                return (
                  <div className="flex justify-end gap-2">
                    {canEdit ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link to={paths.app.editListing(listing.id)}>Editar</Link>
                      </Button>
                    ) : null}

                    {listing.slug && listing.status === 'approved' ? (
                      <Button asChild size="sm" type="button" variant="ghost">
                        <Link to={paths.public.listingDetails(listing.slug)}>
                          <Eye className="size-4" />
                          Ver página pública
                        </Link>
                      </Button>
                    ) : null}

                    {canSubmit ? (
                      <Button
                        disabled={isBusy}
                        onClick={() => {
                          setFeedback(null)
                          submitMutation.mutate(listing.id)
                        }}
                        size="sm"
                        type="button"
                      >
                        <SendHorizontal className="size-4" />
                        {submitMutation.isPending ? 'Enviando...' : 'Enviar para análise'}
                      </Button>
                    ) : null}

                    {canPause ? (
                      <Button
                        disabled={isBusy}
                        onClick={() => {
                          setFeedback(null)
                          pauseMutation.mutate(listing.id)
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PauseCircle className="size-4" />
                        {pauseMutation.isPending ? 'Pausando...' : 'Pausar anúncio'}
                      </Button>
                    ) : null}

                    {canArchive ? (
                      <Button
                        disabled={isBusy}
                        onClick={() => setListingPendingArchive({ id: listing.id, title: listing.title })}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Archive className="size-4" />
                        {archiveMutation.isPending ? 'Arquivando...' : 'Arquivar anúncio'}
                      </Button>
                    ) : null}

                    {canRequestFeaturedPayment ? (
                      <Button
                        disabled={isBusy}
                        onClick={() => {
                          setFeedback(null)
                          createFeaturedPaymentMutation.mutate(listing.id)
                        }}
                        size="sm"
                        type="button"
                        variant={hasPendingFeaturedPayment ? 'outline' : 'default'}
                      >
                        <Star className="size-4" />
                        {hasPendingFeaturedPayment
                          ? 'Abrir cobrança'
                          : createFeaturedPaymentMutation.isPending
                            ? 'Gerando...'
                            : 'Destacar anúncio'}
                      </Button>
                    ) : null}
                  </div>
                )
              },
            },
          ]}
          data={filteredListings}
          description="Lista dos seus anúncios com o status atual e atalhos rápidos de edição."
          emptyDescription="Nenhum anúncio encontrado."
          emptyTitle="Sem anúncios"
          getRowKey={(listing) => listing.id}
          minWidth="min-w-[1020px]"
          title="Lista de anúncios"
        />
      ) : null}

      <ConfirmActionDialog
        confirmLabel="Arquivar anúncio"
        description={
          listingPendingArchive
            ? `Arquivar o anúncio "${listingPendingArchive.title}"? Ele deixará de aparecer para o público, mas continuará salvo no seu histórico.`
            : ''
        }
        isPending={archiveMutation.isPending}
        onConfirm={() => {
          if (!listingPendingArchive) {
            return
          }

          setFeedback(null)
          archiveMutation.mutate(listingPendingArchive.id)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setListingPendingArchive(null)
          }
        }}
        open={Boolean(listingPendingArchive)}
        title="Confirmar arquivamento"
        tone="default"
      />

      {reviewSubmissionModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar confirmação de envio"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setReviewSubmissionModal(null)}
            type="button"
          />
          <div className="relative w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <p className="text-base font-semibold text-foreground">Anúncio enviado para análise</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Seu anúncio
              {' '}
              <span className="font-medium text-foreground">"{reviewSubmissionModal.listingTitle || reviewSubmissionModal.listingId}"</span>
              {' '}
              foi enviado com sucesso. Você pode acompanhar o andamento nesta página.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setReviewSubmissionModal(null)} type="button">
                Entendi
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
