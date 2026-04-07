import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchUserListings } from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function AppOverviewPage() {
  const { user } = useAuth()

  const listingsQuery = useQuery({
    queryKey: ['listings', 'owner', user?.profileId],
    queryFn: () => fetchUserListings(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const listings = listingsQuery.data ?? []
  const recentListings = listings.slice(0, 4)

  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      drafts: listings.filter((listing) => listing.status === 'draft').length,
    }),
    [listings],
  )

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Visao geral do anunciante
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Acompanhe o pipeline dos anuncios e entre rapidamente nos fluxos de criacao, edicao e
          revisao.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Rascunhos</p>
            <p className="mt-2 font-display text-3xl">{stats.drafts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Em revisao</p>
            <p className="mt-2 font-display text-3xl">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Aprovados</p>
            <p className="mt-2 font-display text-3xl">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Ultimos anuncios</CardTitle>
              <CardDescription>Lista privada do usuario com acesso rapido a edicao.</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link to={paths.app.listings}>Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {listingsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando anuncios...</p>
            ) : null}

            {recentListings.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-3 rounded-3xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <ListingStatusBadge status={listing.status} />
                    <p className="text-xs text-muted-foreground">{formatListingDate(listing.updatedAt)}</p>
                  </div>
                  <p className="font-medium text-foreground">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city} - {listing.state}
                  </p>
                </div>

                <Button asChild variant="outline">
                  <Link to={paths.app.editListing(listing.id)}>Editar</Link>
                </Button>
              </div>
            ))}

            {!listingsQuery.isLoading && recentListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum anuncio criado ainda. Use o fluxo de novo anuncio para comecar.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos operacionais</CardTitle>
            <CardDescription>Entradas principais do primeiro fluxo do MVP.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to={paths.app.newListing}>Criar anuncio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={paths.app.listings}>Gerenciar anuncios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
