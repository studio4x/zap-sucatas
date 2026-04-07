import { Link } from 'react-router-dom'
import { MapPin, Package } from 'lucide-react'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/domains/listings/types'

type PublicListingCardProps = {
  listing: Listing
}

export function PublicListingCard({ listing }: PublicListingCardProps) {
  const coverImage = listing.images[0]?.publicUrl

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/10] bg-muted">
        {coverImage ? (
          <img
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
            src={coverImage}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <ListingStatusBadge status={listing.status} />
          {listing.categoryName ? (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {listing.categoryName}
            </span>
          ) : null}
        </div>
        <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {listing.summary || listing.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-muted-foreground">
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
        </div>

        <Button asChild className="w-full" disabled={!listing.slug}>
          <Link to={listing.slug ? paths.public.listingDetails(listing.slug) : paths.public.listings}>
            Ver anuncio
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
