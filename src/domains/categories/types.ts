export type ListingCategory = {
  createdAt: string
  description: string | null
  id: string
  isActive: boolean
  name: string
  slug: string
  sortOrder: number
  updatedAt: string
}

export type ListingMaterial = {
  createdAt: string
  id: string
  isActive: boolean
  name: string
  slug: string
  updatedAt: string
}

export type AdminListingCategory = ListingCategory & {
  approvedListings: number
  pendingListings: number
  totalListings: number
}

export type AdminListingMaterial = ListingMaterial & {
  approvedListings: number
  pendingListings: number
  totalListings: number
}
