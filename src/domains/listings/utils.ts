import type {
  ListingDetails,
  ListingFormValues,
  ListingStatus,
} from '@/domains/listings/types'

export const listingStatusFilterOptions: Array<{ label: string; value: ListingStatus | 'all' }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Em revisao', value: 'pending_review' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Pausado', value: 'paused' },
  { label: 'Arquivado', value: 'archived' },
]

export function normalizeListingCity(value: string) {
  const collapsed = value.trim().replace(/\s+/g, ' ')

  if (!collapsed) {
    return ''
  }

  if (collapsed === collapsed.toUpperCase() || collapsed === collapsed.toLowerCase()) {
    return collapsed
      .toLocaleLowerCase('pt-BR')
      .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'))
  }

  return collapsed
}

export function normalizeListingState(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}

export function createEmptyListingFormValues(): ListingFormValues {
  return {
    attributes: [],
    categoryId: '',
    city: '',
    conditionType: '',
    contactName: '',
    contactPhone: '',
    contactPhoneIsWhatsapp: false,
    description: '',
    priceLabel: '',
    primaryMaterialId: '',
    state: '',
    summary: '',
    title: '',
  }
}

export function listingToFormValues(listing: ListingDetails): ListingFormValues {
  return {
    attributes: listing.attributes.map((attribute) => ({
      attributeLabel: attribute.attributeLabel,
      attributeValue: attribute.attributeValue,
    })),
    categoryId: listing.categoryId,
    city: listing.city,
    conditionType: listing.conditionType ?? '',
    contactName: listing.contactName ?? '',
    contactPhone: listing.contactPhone ?? '',
    contactPhoneIsWhatsapp: listing.contactPhoneIsWhatsapp,
    description: listing.description,
    priceLabel: listing.priceLabel ?? '',
    primaryMaterialId: listing.primaryMaterialId ?? '',
    state: listing.state,
    summary: listing.summary ?? '',
    title: listing.title,
  }
}

export function formatListingDate(value: string | null) {
  if (!value) {
    return 'Nao publicado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
