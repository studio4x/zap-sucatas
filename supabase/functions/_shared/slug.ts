import { createAdminClient } from './supabase.ts'

export function slugifyValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function generateUniqueSlug(input: {
  currentId?: string | null
  fallback: string
  source: string
  table: 'listing_categories' | 'listing_materials' | 'listings'
}) {
  const admin = createAdminClient()
  const baseSlug = slugifyValue(input.source) || input.fallback
  let candidate = baseSlug
  let counter = 0

  while (true) {
    let query = admin.from(input.table).select('id').eq('slug', candidate).limit(1)

    if (input.currentId) {
      query = query.neq('id', input.currentId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return candidate
    }

    counter += 1
    candidate = `${baseSlug}-${counter}`
  }
}

export async function generateUniqueListingSlug(title: string, listingId: string) {
  return generateUniqueSlug({
    currentId: listingId,
    fallback: 'anúncio',
    source: title,
    table: 'listings',
  })
}