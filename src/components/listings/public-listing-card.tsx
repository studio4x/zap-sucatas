import { ArrowUpRight, Clock3, MapPin, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Listing } from '@/domains/listings/types'
import { formatListingDate } from '@/domains/listings/utils'

type PublicListingCardProps = {
  listing: Listing
}

export function PublicListingCard({ listing }: PublicListingCardProps) {
  const coverImage = listing.images[0]?.publicUrl

  return (
    <Card className="group h-full overflow-hidden border-border/80 transition duration-200 hover:-translate-y-1 hover:border-primary/35">
      <div className="relative aspect-[16/10] bg-muted">
        {coverImage ? (
          <img
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            src={coverImage}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={listing.status} />
          {listing.isFeatured ? <Badge className="bg-white/92 text-foreground">Em destaque</Badge> : null}
        </div>
      </div>

      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            {listing.categoryName ? (
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
                {listing.categoryName}
              </span>
            ) : null}
            <h3 className="line-clamp-2 font-display text-2xl tracking-tight text-foreground">
              {listing.title}
            </h3>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
          {listing.summary || listing.description}
        </p>

        <div className="grid gap-2.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {listing.city} - {listing.state}
          </p>
          {listing.materialName ? (
            <p className="flex items-center gap-2">
              <Package className="size-4" />
              {listing.materialName}
            </p>
          ) : null}
          <p className="flex items-center gap-2">
            <Clock3 className="size-4" />
            {formatListingDate(listing.publishedAt)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/80 pt-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Faixa comercial
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {listing.priceLabel ?? 'Sob consulta'}
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
            to={listing.slug ? paths.public.listingDetails(listing.slug) : paths.public.listings}
          >
            Ver anúncio
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
