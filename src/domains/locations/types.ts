export type ListingLocation = {
  city: string
  state: string
}

export type AdminListingLocation = ListingLocation & {
  approvedListings: number
  lastUpdatedAt: string | null
  pendingListings: number
  totalListings: number
}
