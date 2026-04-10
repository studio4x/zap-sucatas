export type ListingStatus =
  | 'approved'
  | 'archived'
  | 'draft'
  | 'expired'
  | 'paused'
  | 'pending_review'
  | 'rejected'

export type ListingImage = {
  altText: string | null
  createdAt: string
  id: string
  isCover: boolean
  listingId: string
  publicUrl: string
  sortOrder: number
  storagePath: string
}

export type ListingAttribute = {
  attributeKey: string
  attributeLabel: string
  attributeValue: string
  createdAt: string
  id: string
  listingId: string
}

export type Listing = {
  categoryId: string
  categoryName: string | null
  categorySlug: string | null
  city: string
  conditionType: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  description: string
  expiresAt: string | null
  id: string
  images: ListingImage[]
  isFeatured: boolean
  materialName: string | null
  materialSlug: string | null
  primaryMaterialId: string | null
  priceLabel: string | null
  publishedAt: string | null
  rejectionReason: string | null
  slug: string | null
  state: string
  status: ListingStatus
  summary: string | null
  title: string
  updatedAt: string
  userId: string
}

export type ListingCategory = {
  description: string | null
  id: string
  name: string
  slug: string
}

export type ListingMaterial = {
  id: string
  name: string
  slug: string
}

export type ListingDetails = Listing & {
  attributes: ListingAttribute[]
}

export type ListingFormAttribute = {
  attributeLabel: string
  attributeValue: string
}

export type ListingFormValues = {
  attributes: ListingFormAttribute[]
  categoryId: string
  city: string
  conditionType: string
  contactName: string
  contactPhone: string
  description: string
  priceLabel: string
  primaryMaterialId: string
  state: string
  summary: string
  title: string
}

export type ListingListFilters = {
  query?: string
  status?: ListingStatus | 'all'
}

export type PublicListingSort =
  | 'featured'
  | 'oldest'
  | 'recent'
  | 'title_asc'
  | 'title_desc'

export type PublicListingFilters = {
  categoryId?: string
  city?: string
  page?: number
  pageSize?: number
  primaryMaterialId?: string
  query?: string
  sort?: PublicListingSort
  state?: string
}
