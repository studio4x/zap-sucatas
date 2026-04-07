import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchAdminListings } from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'

export function AdminListingsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof listingStatusFilterOptions)[number]['value']>('all')

  const listingsQuery = useQuery({
    queryKey: ['listings', 'admin'],
    queryFn: () => fetchAdminListings(),
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
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      total: listings.length,
    }),
    [listings],
  )

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Admin / anuncios
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Fila de moderacao e catalogo interno
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Revise anuncios pendentes, acompanhe aprovacoes e abra o detalhe operacional de cada
          item.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', stats.total],
          ['Pendentes', stats.pending],
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
              placeholder="Buscar anuncio"
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
            Carregando fila administrativa...
          </CardContent>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="border-rose-200/70 bg-rose-50">
          <CardContent className="p-6 text-sm text-rose-900">
            Nao foi possivel carregar os anuncios administrativos.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id}>
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

              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
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
                <p>
                  <span className="font-medium text-foreground">Material:</span>{' '}
                  {listing.materialName ?? 'Nao informado'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={paths.admin.listingDetails(listing.id)}>Abrir moderacao</Link>
                </Button>

                {listing.slug ? (
                  <Button asChild variant="outline">
                    <Link to={paths.public.listingDetails(listing.slug)}>Ver publico</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
