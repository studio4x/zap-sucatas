import { createAdminClient } from './supabase.ts'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function generateUniqueListingSlug(title: string, listingId: string) {
  const admin = createAdminClient()
  const baseSlug = slugify(title) || 'anuncio'
  let candidate = baseSlug
  let counter = 0

  while (true) {
    const { data, error } = await admin
      .from('listings')
      .select('id')
      .eq('slug', candidate)
      .neq('id', listingId)
      .limit(1)

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
