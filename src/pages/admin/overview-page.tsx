import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchAdminListings } from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'

export function AdminOverviewPage() {
  const listingsQuery = useQuery({
    queryKey: ['listings', 'admin'],
    queryFn: () => fetchAdminListings(),
  })

  const listings = listingsQuery.data ?? []
  const pendingListings = listings.filter((listing) => listing.status === 'pending_review').slice(0, 5)

  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
    }),
    [listings],
  )

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Visao geral administrativa
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Acompanhe a fila critica de anuncios e entre rapidamente na moderacao do MVP.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="mt-2 font-display text-3xl">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Aprovados</p>
            <p className="mt-2 font-display text-3xl">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Rejeitados</p>
            <p className="mt-2 font-display text-3xl">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Fila prioritaria</CardTitle>
              <CardDescription>Anuncios aguardando decisao administrativa.</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link to={paths.admin.listings}>Abrir fila completa</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {listingsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando fila...</p>
            ) : null}

            {pendingListings.map((listing) => (
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
                  <Link to={paths.admin.listingDetails(listing.id)}>Moderar</Link>
                </Button>
              </div>
            ))}

            {!listingsQuery.isLoading && pendingListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum anuncio pendente no momento.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
            <CardDescription>Entradas principais do backoffice inicial.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to={paths.admin.listings}>Moderar anuncios</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={paths.public.listings}>Ver catalogo publico</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
