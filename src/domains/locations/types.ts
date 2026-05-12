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

export type AdminLocationListingItem = {
  city: string
  id: string
  state: string
  status: string
  title: string
  updatedAt: string
}
