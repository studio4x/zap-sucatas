import { supabase } from '@/integrations/supabase/client'
import type {
  AdminListingCategory,
  AdminListingMaterial,
  ListingCategory,
  ListingMaterial,
  PublicListingCategoryNode,
} from '@/domains/categories/types'
import type {
  AdminCategoryFormValues,
  AdminMaterialFormValues,
} from '@/domains/categories/schemas'
import {
  buildCategoryTree,
  findCategoryNodeBySlug,
  flattenCategoryTree,
  type CategoryHierarchyMetrics,
} from '@/domains/categories/utils'

type CategoryRow = {
  created_at: string
  description: string | null
  id: string
  is_active: boolean
  name: string
  parent_id: string | null
  slug: string
  sort_order: number
  updated_at: string
}

type MaterialRow = {
  created_at: string
  id: string
  is_active: boolean
  name: string
  slug: string
  updated_at: string
}

type ListingCountRow = {
  category_id: string | null
  primary_material_id: string | null
  status: 'approved' | 'archived' | 'draft' | 'expired' | 'paused' | 'pending_review' | 'rejected'
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
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

function mapCategory(row: CategoryRow): ListingCategory {
  return {
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    parentId: row.parent_id,
    slug: row.slug,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  }
}

function mapMaterial(row: MaterialRow): ListingMaterial {
  return {
    createdAt: row.created_at,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    slug: row.slug,
    updatedAt: row.updated_at,
  }
}

function buildCountMaps(rows: ListingCountRow[]) {
  const categoryCounts = new Map<string, CategoryHierarchyMetrics>()
  const materialCounts = new Map<string, CategoryHierarchyMetrics>()

  rows.forEach((row) => {
    if (row.category_id) {
      const current = categoryCounts.get(row.category_id) ?? {
        approvedListings: 0,
        pendingListings: 0,
        totalListings: 0,
      }
      current.totalListings += 1
      if (row.status === 'approved') {
        current.approvedListings += 1
      }
      if (row.status === 'pending_review') {
        current.pendingListings += 1
      }
      categoryCounts.set(row.category_id, current)
    }

    if (row.primary_material_id) {
      const current = materialCounts.get(row.primary_material_id) ?? {
        approvedListings: 0,
        pendingListings: 0,
        totalListings: 0,
      }
      current.totalListings += 1
      if (row.status === 'approved') {
        current.approvedListings += 1
      }
      if (row.status === 'pending_review') {
        current.pendingListings += 1
      }
      materialCounts.set(row.primary_material_id, current)
    }
  })

  return { categoryCounts, materialCounts }
}

export async function fetchAdminCategories() {
  const client = ensureSupabase()
  const [{ data: categories, error: categoriesError }, { data: listings, error: listingsError }] = await Promise.all([
    client
      .from('listing_categories')
      .select('id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    client.from('listings').select('category_id, primary_material_id, status'),
  ])

  if (categoriesError) {
    throw categoriesError
  }

  if (listingsError) {
    throw listingsError
  }

  const { categoryCounts } = buildCountMaps((listings ?? []) as ListingCountRow[])
  const tree = buildCategoryTree(
    (categories ?? []).map((row) => mapCategory(row as CategoryRow)),
    categoryCounts,
  )

  return flattenCategoryTree(tree) as AdminListingCategory[]
}

export async function fetchAdminMaterials() {
  const client = ensureSupabase()
  const [{ data: materials, error: materialsError }, { data: listings, error: listingsError }] =
    await Promise.all([
      client
        .from('listing_materials')
        .select('id, name, slug, is_active, created_at, updated_at')
        .order('name', { ascending: true }),
      client.from('listings').select('category_id, primary_material_id, status'),
    ])

  if (materialsError) {
    throw materialsError
  }

  if (listingsError) {
    throw listingsError
  }

  const { materialCounts } = buildCountMaps((listings ?? []) as ListingCountRow[])

  return (materials ?? []).map((row) => {
    const material = mapMaterial(row as MaterialRow)
    const counts = materialCounts.get(material.id) ?? {
      approvedListings: 0,
      pendingListings: 0,
      totalListings: 0,
    }

    return {
      ...material,
      approvedListings: counts.approvedListings,
      pendingListings: counts.pendingListings,
      totalListings: counts.totalListings,
    } satisfies AdminListingMaterial
  })
}

export async function fetchPublicCategories() {
  const client = ensureSupabase()
  const [{ data: categories, error: categoriesError }, { data: listings, error: listingsError }] = await Promise.all([
    client
      .from('listing_categories')
      .select('id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    client.from('listings').select('category_id').eq('status', 'approved'),
  ])

  if (categoriesError) {
    throw categoriesError
  }

  if (listingsError) {
    throw listingsError
  }

  const counts = new Map<string, CategoryHierarchyMetrics>()

  ;((listings ?? []) as Array<{ category_id: string | null }>).forEach((row) => {
    if (!row.category_id) {
      return
    }

    const current = counts.get(row.category_id) ?? {
      approvedListings: 0,
      pendingListings: 0,
      totalListings: 0,
    }
    current.approvedListings += 1
    current.totalListings += 1
    counts.set(row.category_id, current)
  })

  const tree = buildCategoryTree(
    (categories ?? []).map((row) => mapCategory(row as CategoryRow)),
    counts,
  )

  return tree as PublicListingCategoryNode[]
}

export async function fetchPublicCategoryBySlug(slug: string) {
  const categories = await fetchPublicCategories()
  const category = findCategoryNodeBySlug(categories, slug)

  if (!category) {
    throw new Error('Categoria não encontrada.')
  }

  return category
}

export async function createAdminCategory(values: AdminCategoryFormValues) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-category', {
    body: {
      description: values.description,
      mode: 'create',
      name: values.name,
      parentId: values.parentId || null,
      slug: values.slug,
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { categoryId: string; success: boolean }
}

export async function updateAdminCategory(input: {
  categoryId: string
  values: AdminCategoryFormValues
}) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-category', {
    body: {
      description: input.values.description,
      id: input.categoryId,
      isActive: input.values.isActive,
      mode: 'update',
      name: input.values.name,
      parentId: input.values.parentId || null,
      slug: input.values.slug,
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { categoryId: string; success: boolean }
}

export async function deleteAdminCategory(categoryId: string) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-category', {
    body: {
      id: categoryId,
      mode: 'delete',
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { categoryId: string; success: boolean }
}

export async function reorderAdminCategories(input: { orderedIds: string[]; parentId: string | null }) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-category', {
    body: {
      mode: 'reorder',
      orderedIds: input.orderedIds,
      parentId: input.parentId,
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { success: boolean }
}

export async function createAdminMaterial(values: AdminMaterialFormValues) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-material', {
    body: {
      mode: 'create',
      name: values.name,
      slug: values.slug,
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { materialId: string; success: boolean }
}

export async function updateAdminMaterial(input: {
  materialId: string
  values: AdminMaterialFormValues
}) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-material', {
    body: {
      id: input.materialId,
      isActive: input.values.isActive,
      mode: 'update',
      name: input.values.name,
      slug: input.values.slug,
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { materialId: string; success: boolean }
}

export async function deleteAdminMaterial(materialId: string) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-listing-material', {
    body: {
      id: materialId,
      mode: 'delete',
    },
  })

  if (error) {
    await unwrapFunctionError(error)
  }

  return data as { materialId: string; success: boolean }
}
