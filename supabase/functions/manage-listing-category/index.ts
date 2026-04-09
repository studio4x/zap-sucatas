/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { generateUniqueSlug } from '../_shared/slug.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type CreatePayload = {
  description?: string | null
  mode: 'create'
  name?: string
  slug?: string
}

type UpdatePayload = {
  description?: string | null
  id?: string
  isActive?: boolean
  mode: 'update'
  name?: string
  slug?: string
}

type DeletePayload = {
  id?: string
  mode: 'delete'
}

type ReorderPayload = {
  mode: 'reorder'
  orderedIds?: string[]
}

type RequestBody = CreatePayload | DeletePayload | ReorderPayload | UpdatePayload

function normalizeName(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ')
}

function normalizeSlug(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDescription(value: unknown) {
  return typeof value === 'string' ? value.trim() || null : null
}

async function buildCategoryPayload(input: {
  currentId?: string | null
  description?: unknown
  name?: unknown
  slug?: unknown
}) {
  const name = normalizeName(input.name)

  if (name.length < 2) {
    throw new Error('Category name is required.')
  }

  return {
    description: normalizeDescription(input.description),
    name,
    slug: await generateUniqueSlug({
      currentId: input.currentId,
      fallback: 'categoria',
      source: normalizeSlug(input.slug) || name,
      table: 'listing_categories',
    }),
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireAdminProfile(request)
    const payload = (await request.json()) as RequestBody
    const admin = createAdminClient()

    if (payload.mode === 'create') {
      const normalized = await buildCategoryPayload(payload)
      const { data, error } = await admin
        .from('listing_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      const nextSortOrder = (data?.[0]?.sort_order ?? -1) + 1
      const { data: category, error: createError } = await admin
        .from('listing_categories')
        .insert({
          description: normalized.description,
          is_active: true,
          name: normalized.name,
          slug: normalized.slug,
          sort_order: nextSortOrder,
        })
        .select('id')
        .single()

      if (createError || !category) {
        throw createError ?? new Error('Unable to create category.')
      }

      await insertAdminAuditLog({
        action: 'create_listing_category',
        actorUserId: actor.id,
        afterData: {
          ...normalized,
          is_active: true,
          sort_order: nextSortOrder,
        },
        entityId: category.id,
        entityType: 'listing_category',
      })

      return jsonResponse({ categoryId: category.id, success: true })
    }

    if (payload.mode === 'update') {
      const id = typeof payload.id === 'string' ? payload.id.trim() : ''

      if (!id) {
        return jsonResponse({ error: 'Category id is required.' }, 400)
      }

      const { data: existing, error: existingError } = await admin
        .from('listing_categories')
        .select('id, name, slug, description, is_active, sort_order')
        .eq('id', id)
        .single()

      if (existingError || !existing) {
        return jsonResponse({ error: 'Category not found.' }, 404)
      }

      const normalized = await buildCategoryPayload({
        currentId: id,
        description: payload.description,
        name: payload.name,
        slug: payload.slug,
      })
      const nextIsActive =
        typeof payload.isActive === 'boolean' ? payload.isActive : existing.is_active

      const { error: updateError } = await admin
        .from('listing_categories')
        .update({
          description: normalized.description,
          is_active: nextIsActive,
          name: normalized.name,
          slug: normalized.slug,
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      await insertAdminAuditLog({
        action: 'update_listing_category',
        actorUserId: actor.id,
        beforeData: existing,
        afterData: {
          ...existing,
          description: normalized.description,
          is_active: nextIsActive,
          name: normalized.name,
          slug: normalized.slug,
        },
        entityId: id,
        entityType: 'listing_category',
      })

      return jsonResponse({ categoryId: id, success: true })
    }

    if (payload.mode === 'reorder') {
      const orderedIds = Array.isArray(payload.orderedIds) ? payload.orderedIds : []

      if (orderedIds.length === 0) {
        return jsonResponse({ error: 'orderedIds is required.' }, 400)
      }

      const { data: categories, error: categoriesError } = await admin
        .from('listing_categories')
        .select('id')
        .order('sort_order', { ascending: true })

      if (categoriesError) {
        throw categoriesError
      }

      const currentIds = (categories ?? []).map((category) => category.id)

      if (
        currentIds.length !== orderedIds.length ||
        currentIds.some((categoryId) => !orderedIds.includes(categoryId))
      ) {
        return jsonResponse({ error: 'orderedIds must match the current categories.' }, 422)
      }

      for (const [index, id] of orderedIds.entries()) {
        const { error: reorderError } = await admin
          .from('listing_categories')
          .update({ sort_order: index })
          .eq('id', id)

        if (reorderError) {
          throw reorderError
        }
      }

      await insertAdminAuditLog({
        action: 'reorder_listing_categories',
        actorUserId: actor.id,
        afterData: {
          ordered_ids: orderedIds,
        },
        entityType: 'listing_category',
      })

      return jsonResponse({ success: true })
    }

    const id = typeof payload.id === 'string' ? payload.id.trim() : ''

    if (!id) {
      return jsonResponse({ error: 'Category id is required.' }, 400)
    }

    const { data: existing, error: existingError } = await admin
      .from('listing_categories')
      .select('id, name, slug, description, is_active, sort_order')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return jsonResponse({ error: 'Category not found.' }, 404)
    }

    const { count, error: linkedError } = await admin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (linkedError) {
      throw linkedError
    }

    if ((count ?? 0) > 0) {
      return jsonResponse(
        {
          error: 'This category has linked listings. Inactivate it instead of deleting.',
        },
        409,
      )
    }

    const { error: deleteError } = await admin
      .from('listing_categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    await insertAdminAuditLog({
      action: 'delete_listing_category',
      actorUserId: actor.id,
      beforeData: existing,
      entityId: id,
      entityType: 'listing_category',
    })

    return jsonResponse({ categoryId: id, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
