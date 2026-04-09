import { supabase } from '@/integrations/supabase/client'
import { paths } from '@/app/paths'
import type {
  Listing,
  ListingAttribute,
  ListingCategory,
  ListingDetails,
  ListingFormAttribute,
  ListingFormValues,
  ListingImage,
  ListingListFilters,
  ListingMaterial,
  PublicListingFilters,
} from '@/domains/listings/types'

const LISTING_MEDIA_BUCKET = 'listing-media'

type ListingRow = {
  category_id: string
  city: string
  condition_type: string | null
  contact_name: string | null
  contact_phone: string | null
  created_at: string
  description: string
  expires_at: string | null
  id: string
  is_featured: boolean
  price_label: string | null
  primary_material_id: string | null
  published_at: string | null
  rejection_reason: string | null
  slug: string | null
  state: string
  status: Listing['status']
  summary: string | null
  title: string
  updated_at: string
  user_id: string
  listing_categories?: { name: string; slug: string } | null
  listing_materials?: { name: string; slug: string } | null
  listing_images?: ListingImageRow[] | null
}

type ListingImageRow = {
  alt_text: string | null
  created_at: string
  id: string
  is_cover: boolean
  listing_id: string
  sort_order: number
  storage_path: string
}

type ListingAttributeRow = {
  attribute_key: string
  attribute_label: string
  attribute_value: string
  created_at: string
  id: string
  listing_id: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

async function unwrapFunctionError(error: unknown) {
  if (typeof error !== 'object' || error === null || !('context' in error)) {
    throw error
  }

  const context = (error as { context?: Response | { json?: () => Promise<unknown> } }).context

  if (!context) {
    throw error
  }

  if (typeof (context as { json?: () => Promise<unknown> }).json !== 'function') {
    if (error instanceof Error && error.message) {
      throw error
    }

    throw new Error('Falha de rede ao acessar a operação sensível.')
  }

  try {
    const payload = (await (context as Response).json()) as { error?: string }

    if (payload.error) {
      throw new Error(payload.error)
    }
  } catch (parseError) {
    if (parseError instanceof Error && parseError.message) {
      throw parseError
    }

    throw error
  }

  throw error
}

function normalizeAttributeKey(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function toPublicImage(row: ListingImageRow): ListingImage {
  const client = ensureSupabase()
  const { data } = client.storage.from(LISTING_MEDIA_BUCKET).getPublicUrl(row.storage_path)

  return {
    altText: row.alt_text,
    createdAt: row.created_at,
    id: row.id,
    isCover: row.is_cover,
    listingId: row.listing_id,
    publicUrl: data.publicUrl,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
  }
}

function sortImages(images: ListingImage[]) {
  return [...images].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1
    }

    return left.sortOrder - right.sortOrder
  })
}

function mapListing(row: ListingRow): Listing {
  const images = sortImages((row.listing_images ?? []).map(toPublicImage))

  return {
    categoryId: row.category_id,
    categoryName: row.listing_categories?.name ?? null,
    categorySlug: row.listing_categories?.slug ?? null,
    city: row.city,
    conditionType: row.condition_type,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    description: row.description,
    expiresAt: row.expires_at,
    id: row.id,
    images,
    isFeatured: row.is_featured,
    materialName: row.listing_materials?.name ?? null,
    materialSlug: row.listing_materials?.slug ?? null,
    primaryMaterialId: row.primary_material_id,
    priceLabel: row.price_label,
    publishedAt: row.published_at,
    rejectionReason: row.rejection_reason,
    slug: row.slug,
    state: row.state,
    status: row.status,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

function mapAttribute(row: ListingAttributeRow): ListingAttribute {
  return {
    attributeKey: row.attribute_key,
    attributeLabel: row.attribute_label,
    attributeValue: row.attribute_value,
    createdAt: row.created_at,
    id: row.id,
    listingId: row.listing_id,
  }
}

function buildBaseListingQuery() {
  return ensureSupabase()
    .from('listings')
    .select(
      `
        id,
        user_id,
        category_id,
        primary_material_id,
        title,
        slug,
        summary,
        description,
        condition_type,
        price_label,
        contact_name,
        contact_phone,
        city,
        state,
        status,
        rejection_reason,
        is_featured,
        published_at,
        expires_at,
        created_at,
        updated_at,
        listing_categories(name, slug),
        listing_materials(name, slug),
        listing_images(id, listing_id, storage_path, sort_order, alt_text, is_cover, created_at)
      `,
    )
}

async function fetchListingAttributes(listingId: string) {
  const { data, error } = await ensureSupabase()
    .from('listing_attributes')
    .select('id, listing_id, attribute_key, attribute_label, attribute_value, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapAttribute(row as ListingAttributeRow))
}

async function syncListingAttributes(listingId: string, attributes: ListingFormAttribute[]) {
  const client = ensureSupabase()
  const sanitizedAttributes = attributes
    .map((attribute) => ({
      attribute_key: normalizeAttributeKey(attribute.attributeLabel),
      attribute_label: attribute.attributeLabel.trim(),
      attribute_value: attribute.attributeValue.trim(),
      listing_id: listingId,
    }))
    .filter((attribute) => attribute.attribute_label && attribute.attribute_value)

  const { error: deleteError } = await client.from('listing_attributes').delete().eq('listing_id', listingId)

  if (deleteError) {
    throw deleteError
  }

  if (sanitizedAttributes.length === 0) {
    return
  }

  const { error: insertError } = await client.from('listing_attributes').insert(sanitizedAttributes)

  if (insertError) {
    throw insertError
  }
}

export async function fetchListingReferences() {
  const client = ensureSupabase()
  const [{ data: categories, error: categoryError }, { data: materials, error: materialError }] =
    await Promise.all([
      client
        .from('listing_categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      client
        .from('listing_materials')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ])

  if (categoryError) {
    throw categoryError
  }

  if (materialError) {
    throw materialError
  }

  return {
    categories: (categories ?? []) as ListingCategory[],
    materials: (materials ?? []) as ListingMaterial[],
  }
}

export async function fetchUserListings(profileId: string, filters: ListingListFilters = {}) {
  let query = buildBaseListingQuery()
    .eq('user_id', profileId)
    .order('updated_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.query) {
    const search = `%${filters.query.trim()}%`
    query = query.or(`title.ilike.${search},summary.ilike.${search},city.ilike.${search},state.ilike.${search}`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow))
}

export async function fetchAdminListings(filters: ListingListFilters = {}) {
  let query = buildBaseListingQuery().order('updated_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.query) {
    const search = `%${filters.query.trim()}%`
    query = query.or(`title.ilike.${search},summary.ilike.${search},city.ilike.${search},state.ilike.${search}`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow))
}

export async function fetchPublicListings(filters: PublicListingFilters = {}) {
  let query = buildBaseListingQuery()
    .eq('status', 'approved')
    .order('published_at', { ascending: false })

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.primaryMaterialId) {
    query = query.eq('primary_material_id', filters.primaryMaterialId)
  }

  if (filters.state) {
    query = query.ilike('state', filters.state)
  }

  if (filters.city) {
    query = query.ilike('city', `%${filters.city.trim()}%`)
  }

  if (filters.query) {
    const search = `%${filters.query.trim()}%`
    query = query.or(`title.ilike.${search},summary.ilike.${search},description.ilike.${search},city.ilike.${search},state.ilike.${search}`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow))
}

export async function fetchFeaturedPublicListings(limit = 6) {
  const { data, error } = await buildBaseListingQuery()
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow))
}

export async function fetchRelatedPublicListingsByCategory(input: {
  categoryId: string
  excludeListingId: string
  limit?: number
}) {
  const { data, error } = await buildBaseListingQuery()
    .eq('status', 'approved')
    .eq('category_id', input.categoryId)
    .neq('id', input.excludeListingId)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(input.limit ?? 3)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow))
}

export async function fetchListingDetailsForOwner(listingId: string) {
  const { data, error } = await buildBaseListingQuery().eq('id', listingId).single()

  if (error || !data) {
    throw error ?? new Error('Anuncio nao encontrado.')
  }

  const listing = data as ListingRow
  const attributes = await fetchListingAttributes(listing.id)

  return {
    ...mapListing(listing),
    attributes,
  } satisfies ListingDetails
}

export async function fetchListingDetailsForAdmin(listingId: string) {
  return fetchListingDetailsForOwner(listingId)
}

export async function fetchPublicListingBySlug(slug: string) {
  const { data, error } = await buildBaseListingQuery().eq('slug', slug).eq('status', 'approved').single()

  if (error || !data) {
    throw error ?? new Error('Anuncio nao encontrado.')
  }

  const listing = data as ListingRow
  const attributes = await fetchListingAttributes(listing.id)

  return {
    ...mapListing(listing),
    attributes,
  } satisfies ListingDetails
}

function mapListingPayload(values: ListingFormValues) {
  return {
    category_id: values.categoryId,
    city: values.city.trim(),
    condition_type: values.conditionType.trim() || null,
    contact_name: values.contactName.trim() || null,
    contact_phone: values.contactPhone.trim() || null,
    description: values.description.trim(),
    price_label: values.priceLabel.trim() || null,
    primary_material_id: values.primaryMaterialId.trim() || null,
    state: values.state.trim().toUpperCase(),
    summary: values.summary.trim() || null,
    title: values.title.trim(),
  }
}

export async function createListingDraft(input: {
  profileId: string
  values: ListingFormValues
}) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('listings')
    .insert({
      ...mapListingPayload(input.values),
      user_id: input.profileId,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Falha ao criar anuncio.')
  }

  const createdListing = data as { id: string }

  await syncListingAttributes(createdListing.id, input.values.attributes)

  return createdListing.id
}

export async function updateListingDraft(input: {
  listingId: string
  values: ListingFormValues
}) {
  const client = ensureSupabase()
  const { error } = await client
    .from('listings')
    .update(mapListingPayload(input.values))
    .eq('id', input.listingId)

  if (error) {
    throw error
  }

  await syncListingAttributes(input.listingId, input.values.attributes)
}

export async function uploadListingImages(input: {
  authUserId: string
  files: File[]
  listingId: string
}) {
  if (input.files.length === 0) {
    return []
  }

  const client = ensureSupabase()
  const { data: currentImages, error: currentImagesError } = await client
    .from('listing_images')
    .select('id, listing_id, storage_path, sort_order, alt_text, is_cover, created_at')
    .eq('listing_id', input.listingId)
    .order('sort_order', { ascending: true })

  if (currentImagesError) {
    throw currentImagesError
  }

  const startSortOrder = currentImages?.length ?? 0
  const rowsToInsert: {
    alt_text: string | null
    is_cover: boolean
    listing_id: string
    sort_order: number
    storage_path: string
  }[] = []

  for (const [index, file] of input.files.entries()) {
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase()
    const storagePath = `users/${input.authUserId}/${input.listingId}/${Date.now()}-${index}-${baseName}.${extension}`

    const { error: uploadError } = await client.storage.from(LISTING_MEDIA_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      throw uploadError
    }

    rowsToInsert.push({
      alt_text: null,
      is_cover: !currentImages?.length && index === 0,
      listing_id: input.listingId,
      sort_order: startSortOrder + index,
      storage_path: storagePath,
    })
  }

  const { data, error } = await client
    .from('listing_images')
    .insert(rowsToInsert)
    .select('id, listing_id, storage_path, sort_order, alt_text, is_cover, created_at')

  if (error) {
    throw error
  }

  return sortImages((data ?? []).map((row) => toPublicImage(row as ListingImageRow)))
}

export async function removeListingImage(image: ListingImage) {
  const client = ensureSupabase()
  const { error: storageError } = await client.storage.from(LISTING_MEDIA_BUCKET).remove([image.storagePath])

  if (storageError) {
    throw storageError
  }

  const { error: deleteError } = await client.from('listing_images').delete().eq('id', image.id)

  if (deleteError) {
    throw deleteError
  }
}

export async function syncListingCoverImage(listingId: string, preferredImageId?: string | null) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('listing_images')
    .select('id, listing_id, storage_path, sort_order, alt_text, is_cover, created_at')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  const images = (data ?? []) as ListingImageRow[]

  if (images.length === 0) {
    return
  }

  const selectedId = images.some((image) => image.id === preferredImageId)
    ? preferredImageId
    : images.find((image) => image.is_cover)?.id ?? images[0]?.id

  if (!selectedId) {
    return
  }

  const { error: resetError } = await client
    .from('listing_images')
    .update({ is_cover: false })
    .eq('listing_id', listingId)

  if (resetError) {
    throw resetError
  }

  const { error: setCoverError } = await client
    .from('listing_images')
    .update({ is_cover: true })
    .eq('id', selectedId)

  if (setCoverError) {
    throw setCoverError
  }
}

export async function reorderListingImages(input: {
  coverImageId?: string | null
  listingId: string
  orderedImageIds: string[]
}) {
  return invokeListingFunction<
    { coverImageId?: string | null; listingId: string; orderedImageIds: string[] },
    { coverImageId: string; listingId: string; orderedImageIds: string[]; success: boolean }
  >('reorder-listing-images', input)
}

async function invokeListingFunction<TBody extends object, TResponse>(name: string, body: TBody) {
  const client = ensureSupabase()
  const { data, error } = await client.functions.invoke(name, { body })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as TResponse
}

export async function submitListingForReview(listingId: string) {
  return invokeListingFunction<{ listingId: string }, { status: string; success: boolean }>(
    'submit-listing-for-review',
    { listingId },
  )
}

export async function approveListing(listingId: string) {
  return invokeListingFunction<{ listingId: string }, { slug: string; status: string; success: boolean }>(
    'approve-listing',
    { listingId },
  )
}

export async function rejectListing(input: { listingId: string; reason: string }) {
  return invokeListingFunction<{ listingId: string; reason: string }, { status: string; success: boolean }>(
    'reject-listing',
    input,
  )
}

export async function pauseListing(listingId: string) {
  return invokeListingFunction<{ action: 'pause'; listingId: string }, { status: string; success: boolean }>(
    'manage-listing-lifecycle',
    {
      action: 'pause',
      listingId,
    },
  )
}

export async function archiveListing(listingId: string) {
  return invokeListingFunction<{ action: 'archive'; listingId: string }, { status: string; success: boolean }>(
    'manage-listing-lifecycle',
    {
      action: 'archive',
      listingId,
    },
  )
}

export function getListingEditPath(listingId: string) {
  return paths.app.editListing(listingId)
}
