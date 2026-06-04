import { ArrowRight, ArrowUpRight, Clock3, MapPin, Package, Phone } from 'lucide-react'
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

function resolveListingCardImageUrl(url: string) {
  if (!url.includes('/storage/v1/object/public/')) {
    return url
  }

  const transformedBase = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const separator = transformedBase.includes('?') ? '&' : '?'
  return `${transformedBase}${separator}width=1200&height=900&resize=cover&quality=85`
}

export function PublicListingCard({ listing }: PublicListingCardProps) {
  const coverImage = listing.images[0]?.publicUrl
  const targetPath = listing.slug ? paths.public.listingDetails(listing.slug) : paths.public.listings

  return (
    <Card className="group relative h-full overflow-hidden rounded-[1.85rem] border-0 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_-36px_rgba(19,33,23,0.35)]">
      <Link aria-label={`Ver anúncio ${listing.title}`} className="absolute inset-0 z-10 rounded-[1.85rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" to={targetPath} />
      <div className="relative z-20 flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(160deg,#f0f8ed_0%,#d6ebd1_100%)]">
          {coverImage ? (
            <img
              alt={listing.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              height={900}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              src={resolveListingCardImageUrl(coverImage)}
              width={1200}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Imagem em atualização
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <ListingStatusBadge status={listing.status} />
              {listing.isFeatured ? (
                <Badge className="border-white/60 bg-white/94 text-foreground" variant="outline">
                  Destaque
                </Badge>
              ) : null}
            </div>
            <div className="rounded-full bg-slate-950/50 p-2 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
        </div>

        <CardContent className="flex h-full flex-col gap-5 p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              {listing.categoryName ? <span>{listing.categoryName}</span> : null}
              {listing.materialName ? <span className="text-muted-foreground">• {listing.materialName}</span> : null}
            </div>

            <h3 className="line-clamp-2 font-display text-[1.85rem] leading-[1.02] tracking-[-0.04em] text-foreground">
              {listing.title}
            </h3>

            <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
              {listing.summary || listing.description}
            </p>
          </div>

          <div className="grid gap-2.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              {listing.city} - {listing.state}
            </p>
            {listing.materialName ? (
              <p className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                {listing.materialName}
              </p>
            ) : null}
            {listing.contactPhone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                Contato comercial disponível
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <Clock3 className="size-4 text-primary" />
              Publicado em {formatListingDate(listing.publishedAt)}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-start pt-5">
            <Link
              className="relative z-20 inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:gap-3"
              to={targetPath}
            >
              Ver anúncio
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
