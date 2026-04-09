import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, Eye, Image as ImageIcon, PauseCircle } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  approveListing,
  archiveListing,
  fetchListingDetailsForAdmin,
  pauseListing,
  rejectListing,
} from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'

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

type FeedbackState = {
  message: string
  tone: 'error' | 'success' | 'warning'
}

export function AdminListingDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const listingQuery = useQuery({
    queryKey: ['listing', 'admin', id],
    queryFn: () => fetchListingDetailsForAdmin(id),
    enabled: Boolean(id),
  })

  async function invalidateListing() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listing', 'admin', id] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'owner'] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
    ])
  }

  const approveMutation = useMutation({
    mutationFn: () => approveListing(id),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível aprovar o anúncio.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      await invalidateListing()
      navigate(paths.admin.listings, { replace: true })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectListing({ listingId: id, reason: rejectionReason }),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível rejeitar o anúncio.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      await invalidateListing()
      navigate(paths.admin.listings, { replace: true })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => pauseListing(id),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível pausar o anúncio.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Anúncio pausado com sucesso.',
        tone: 'success',
      })
      await invalidateListing()
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveListing(id),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível arquivar o anúncio.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Anúncio arquivado com sucesso.',
        tone: 'warning',
      })
      await invalidateListing()
      navigate(paths.admin.listings, { replace: true })
    },
  })

  if (listingQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando detalhe administrativo...
      </div>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm">
        Não foi possível carregar o detalhe do anúncio.
      </div>
    )
  }

  const listing = listingQuery.data
  const statusMeta = getListingStatusMeta(listing.status)
  const isBusy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    pauseMutation.isPending ||
    archiveMutation.isPending
  const canApproveOrReject = listing.status === 'pending_review'
  const canPause = listing.status === 'approved'
  const canArchive = listing.status !== 'archived'

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.listings}>Voltar para anúncios</Link>
            </Button>
            {listing.slug && listing.status === 'approved' ? (
              <Button asChild type="button" variant="outline">
                <Link to={paths.public.listingDetails(listing.slug)}>
                  <Eye className="size-4" />
                  Ver público
                </Link>
              </Button>
            ) : null}
          </>
        }
        description={
          listing.summary ||
          'Detalhe operacional do anúncio para moderação, validação e decisão editorial.'
        }
        eyebrow="Admin / anúncios / detalhe"
        title={listing.title}
      />

      {feedback ? (
        <div
          className={
            feedback.tone === 'error'
              ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm'
              : feedback.tone === 'warning'
                ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm'
                : 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm'
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <AdminStatusBadge tone={statusMeta.tone}>{statusMeta.label}</AdminStatusBadge>
        <span className="text-sm text-muted-foreground">
          {listing.categoryName ?? 'Sem categoria'} / {listing.materialName ?? 'Material não informado'}
        </span>
        <span className="text-sm text-muted-foreground">
          {listing.city} - {listing.state}
        </span>
        <span className="text-sm text-muted-foreground">
          Atualizado em {formatListingDate(listing.updatedAt)}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição e evidências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                {listing.description}
              </p>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Mídia enviada</h2>
                {listing.images.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                    <ImageIcon className="size-4" />
                    Nenhuma imagem enviada.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {listing.images.map((image) => (
                      <div
                        key={image.id}
                        className="overflow-hidden rounded-lg border border-border bg-muted/30"
                      >
                        <div className="aspect-[16/10] bg-muted">
                          <img
                            alt={image.altText ?? listing.title}
                            className="h-full w-full object-cover"
                            src={image.publicUrl}
                          />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                          <span>{image.isCover ? 'Capa' : 'Imagem complementar'}</span>
                          <span>Posição {image.sortOrder + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <AdminDataTable
            columns={[
              {
                header: 'Campo',
                className: 'w-[220px]',
                cell: (attribute) => (
                  <span className="font-medium text-foreground">{attribute.attributeLabel}</span>
                ),
              },
              {
                header: 'Valor',
                cell: (attribute) => (
                  <span className="text-sm text-muted-foreground">{attribute.attributeValue}</span>
                ),
              },
            ]}
            data={listing.attributes}
            emptyDescription="O anúncio não possui atributos estruturados cadastrados."
            emptyTitle="Sem atributos adicionais"
            getRowKey={(attribute) => attribute.id}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadados operacionais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div>
                <p className="font-medium text-foreground">Localidade</p>
                <p className="text-muted-foreground">
                  {listing.city} - {listing.state}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Contato</p>
                <p className="text-muted-foreground">{listing.contactName ?? 'Não informado'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Telefone</p>
                <p className="text-muted-foreground">{listing.contactPhone ?? 'Não informado'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Preço</p>
                <p className="text-muted-foreground">{listing.priceLabel ?? 'Não informado'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Criado em</p>
                <p className="text-muted-foreground">{formatListingDate(listing.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Publicado em</p>
                <p className="text-muted-foreground">{formatListingDate(listing.publishedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {listing.rejectionReason ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
              <p className="font-semibold text-rose-800">Última rejeição</p>
              <p className="mt-1 leading-6">{listing.rejectionReason}</p>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Decisão de moderação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canApproveOrReject ? (
                <>
                  <Button
                    className="w-full justify-center"
                    disabled={isBusy}
                    onClick={() => {
                      setFeedback(null)
                      approveMutation.mutate()
                    }}
                    type="button"
                  >
                    {approveMutation.isPending ? 'Aprovando...' : 'Aprovar anúncio'}
                  </Button>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="rejection-reason">
                      Motivo da rejeição
                    </label>
                    <Textarea
                      id="rejection-reason"
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Explique o que o anunciante precisa corrigir."
                      value={rejectionReason}
                    />
                  </div>

                  <Button
                    className="w-full justify-center"
                    disabled={!rejectionReason.trim() || isBusy}
                    onClick={() => {
                      setFeedback(null)
                      rejectMutation.mutate()
                    }}
                    type="button"
                    variant="destructive"
                  >
                    {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar anúncio'}
                  </Button>
                </>
              ) : null}

              {canPause ? (
                <Button
                  className="w-full justify-center"
                  disabled={isBusy}
                  onClick={() => {
                    setFeedback(null)
                    pauseMutation.mutate()
                  }}
                  type="button"
                  variant="outline"
                >
                  <PauseCircle className="size-4" />
                  {pauseMutation.isPending ? 'Pausando...' : 'Pausar anúncio'}
                </Button>
              ) : null}

              {canArchive ? (
                <Button
                  className="w-full justify-center"
                  disabled={isBusy}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Arquivar o anúncio "${listing.title}"? Ele será removido da operação pública e ficará apenas no histórico interno.`,
                    )

                    if (!confirmed) {
                      return
                    }

                    setFeedback(null)
                    archiveMutation.mutate()
                  }}
                  type="button"
                  variant="outline"
                >
                  <Archive className="size-4" />
                  {archiveMutation.isPending ? 'Arquivando...' : 'Arquivar anúncio'}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
