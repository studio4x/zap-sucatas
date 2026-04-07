import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { approveListing, fetchListingDetailsForAdmin, rejectListing } from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'

export function AdminListingDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState('')

  const listingQuery = useQuery({
    queryKey: ['listing', 'admin', id],
    queryFn: () => fetchListingDetailsForAdmin(id),
    enabled: Boolean(id),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveListing(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', 'admin', id] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])
      navigate(paths.admin.listings, { replace: true })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectListing({ listingId: id, reason: rejectionReason }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', 'admin', id] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])
      navigate(paths.admin.listings, { replace: true })
    },
  })

  if (listingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando detalhe administrativo...
        </CardContent>
      </Card>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar o detalhe do anuncio.
        </CardContent>
      </Card>
    )
  }

  const listing = listingQuery.data
  const coverImage = listing.images[0]?.publicUrl

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-card/90 p-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <ListingStatusBadge status={listing.status} />
            {listing.categoryName ? (
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {listing.categoryName}
              </span>
            ) : null}
          </div>
          <h1 className="font-display text-4xl tracking-tight text-foreground">{listing.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {listing.summary || listing.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to={paths.admin.listings}>Voltar para a fila</Link>
          </Button>
          {listing.slug ? (
            <Button asChild variant="outline">
              <Link to={paths.public.listingDetails(listing.slug)}>Ver publico</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-[16/10] bg-muted">
              {coverImage ? (
                <img alt={listing.title} className="h-full w-full object-cover" src={coverImage} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem imagem de capa
                </div>
              )}
            </div>
            {listing.images.length > 1 ? (
              <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                {listing.images.slice(1).map((image) => (
                  <div key={image.id} className="aspect-square overflow-hidden rounded-3xl border border-border/70 bg-muted">
                    <img alt={image.altText ?? listing.title} className="h-full w-full object-cover" src={image.publicUrl} />
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descricao completa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                {listing.description}
              </p>

              {listing.attributes.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {listing.attributes.map((attribute) => (
                    <div key={attribute.id} className="rounded-3xl border border-border/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {attribute.attributeLabel}
                      </p>
                      <p className="mt-2 text-sm text-foreground">{attribute.attributeValue}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Local:</span> {listing.city} -{' '}
                {listing.state}
              </p>
              <p>
                <span className="font-medium text-foreground">Contato:</span>{' '}
                {listing.contactName ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Telefone:</span>{' '}
                {listing.contactPhone ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Material:</span>{' '}
                {listing.materialName ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Preco:</span>{' '}
                {listing.priceLabel ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Atualizado:</span>{' '}
                {formatListingDate(listing.updatedAt)}
              </p>
            </CardContent>
          </Card>

          {listing.rejectionReason ? (
            <Card className="border-rose-200/70 bg-rose-50">
              <CardHeader>
                <CardTitle>Ultima rejeicao</CardTitle>
                <CardDescription>{listing.rejectionReason}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Moderacao</CardTitle>
              <CardDescription>
                Aprove para publicar ou rejeite com orientacao clara para nova submissao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => approveMutation.mutate()}
                type="button"
              >
                {approveMutation.isPending ? 'Aprovando...' : 'Aprovar anuncio'}
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Motivo da rejeicao</label>
                <Textarea
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explique o que precisa ser corrigido antes de uma nova submissao."
                  value={rejectionReason}
                />
              </div>

              <Button
                className="w-full"
                disabled={!rejectionReason.trim() || approveMutation.isPending || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
                type="button"
                variant="destructive"
              >
                {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar anuncio'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
