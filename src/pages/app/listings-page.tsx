import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, FilePlus2, Search, SendHorizontal } from 'lucide-react'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchUserListings, submitListingForReview } from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function AppListingsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof listingStatusFilterOptions)[number]['value']>('all')

  const listingsQuery = useQuery({
    queryKey: ['listings', 'owner', user?.profileId],
    queryFn: () => fetchUserListings(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const submitMutation = useMutation({
    mutationFn: submitListingForReview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user?.profileId] })
    },
  })

  const listings = listingsQuery.data ?? []

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesStatus = statusFilter === 'all' ? true : listing.status === statusFilter
      const normalizedQuery = query.trim().toLowerCase()
      const haystack = `${listing.title} ${listing.summary ?? ''} ${listing.city} ${listing.state}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [listings, query, statusFilter])

  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      drafts: listings.filter((listing) => listing.status === 'draft').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      total: listings.length,
    }),
    [listings],
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-card/90 p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Meus anuncios
          </p>
          <h1 className="font-display text-4xl tracking-tight text-foreground">
            Gestao operacional dos anuncios
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Salve rascunhos, corrija rejeicoes e envie os anuncios completos para a fila de
            revisao.
          </p>
        </div>

        <Button asChild>
          <Link to={paths.app.newListing}>
            <FilePlus2 className="size-4" />
            Novo anuncio
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total', stats.total],
          ['Rascunhos', stats.drafts],
          ['Em revisao', stats.pending],
          ['Aprovados', stats.approved],
          ['Rejeitados', stats.rejected],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-3xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por titulo, cidade ou resumo"
              value={query}
            />
          </div>

          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            value={statusFilter}
          >
            {listingStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {listingsQuery.isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando anuncios do dashboard...
          </CardContent>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="border-rose-200/70 bg-rose-50">
          <CardContent className="p-6 text-sm text-rose-900">
            Nao foi possivel carregar os anuncios.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filteredListings.map((listing) => {
          const coverImage = listing.images[0]?.publicUrl
          const canSubmit =
            listing.status === 'draft' || listing.status === 'rejected' || listing.status === 'paused'

          return (
            <Card key={listing.id} className="overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                <div className="aspect-[4/3] bg-muted lg:aspect-auto">
                  {coverImage ? (
                    <img alt={listing.title} className="h-full w-full object-cover" src={coverImage} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>

                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <ListingStatusBadge status={listing.status} />
                    {listing.categoryName ? (
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {listing.categoryName}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-display text-2xl text-foreground">{listing.title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {listing.summary || listing.description}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <p>
                      <span className="font-medium text-foreground">Local:</span> {listing.city} -{' '}
                      {listing.state}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Atualizado:</span>{' '}
                      {formatListingDate(listing.updatedAt)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Publicado:</span>{' '}
                      {formatListingDate(listing.publishedAt)}
                    </p>
                  </div>

                  {listing.rejectionReason ? (
                    <div className="rounded-3xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                      <span className="font-medium">Motivo da rejeicao:</span>{' '}
                      {listing.rejectionReason}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <Link to={paths.app.editListing(listing.id)}>Editar</Link>
                    </Button>

                    {listing.slug ? (
                      <Button asChild variant="outline">
                        <Link to={paths.public.listingDetails(listing.slug)}>
                          <Eye className="size-4" />
                          Ver publico
                        </Link>
                      </Button>
                    ) : null}

                    {canSubmit ? (
                      <Button
                        disabled={submitMutation.isPending}
                        onClick={() => submitMutation.mutate(listing.id)}
                        type="button"
                      >
                        <SendHorizontal className="size-4" />
                        {submitMutation.isPending ? 'Enviando...' : 'Enviar para revisao'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}

        {!listingsQuery.isLoading && filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-6">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Nenhum anuncio encontrado.</p>
                <p className="text-sm text-muted-foreground">
                  Ajuste os filtros ou crie o primeiro anuncio do dashboard.
                </p>
              </div>
              <Button asChild>
                <Link to={paths.app.newListing}>Criar anuncio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  )
}
