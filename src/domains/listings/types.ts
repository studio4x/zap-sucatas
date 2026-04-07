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
  city: string
  conditionType: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  description: string
  expiresAt: string | null
  id: string
  isFeatured: boolean
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
