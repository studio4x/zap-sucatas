import { PublicListingCard } from '@/components/listings/public-listing-card'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import type { Listing } from '@/domains/listings/types'

type ListingGridProps = {
  emptyDescription: string
  emptyTitle: string
  listings: Listing[]
}

export function ListingGrid({ emptyDescription, emptyTitle, listings }: ListingGridProps) {
  if (listings.length === 0) {
    return <PublicEmptyState description={emptyDescription} title={emptyTitle} />
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {listings.map((listing) => (
        <PublicListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
