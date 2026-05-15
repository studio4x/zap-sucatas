import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PublicListingCard } from '@/components/listings/public-listing-card'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/domains/listings/types'

type FeaturedListingsSectionProps = {
  listings: Listing[]
  title: string
  description: string
  eyebrow?: string
  onViewAllClick?: () => void
}

export function FeaturedListingsSection({
  description,
  eyebrow,
  listings,
  onViewAllClick,
  title,
}: FeaturedListingsSectionProps) {
  return (
    <section className="space-y-6">
      <PublicSectionHeading
        actions={
          onViewAllClick ? (
            <Button onClick={onViewAllClick} type="button" variant="outline">
              Ver todo o catálogo
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to={paths.public.listings}>Ver todo o catálogo</Link>
            </Button>
          )
        }
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <PublicListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  )
}
