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
  parentId?: string | null
  slug?: string
}

type UpdatePayload = {
  description?: string | null
  id?: string
  isActive?: boolean
  mode: 'update'
  name?: string
  parentId?: string | null
  slug?: string
}

type DeletePayload = {
  id?: string
  mode: 'delete'
}

type ReorderPayload = {
  mode: 'reorder'
  orderedIds?: string[]
  parentId?: string | null
}

type RequestBody = CreatePayload | DeletePayload | ReorderPayload | UpdatePayload

type AdminClient = ReturnType<typeof createAdminClient>

type CategoryRecord = {
  id: string
  parent_id: string | null
  sort_order: number
}

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

function normalizeParentId(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function buildCategoryPayload(input: {
  currentId?: string | null
  description?: unknown
  name?: unknown
  parentId?: unknown
  slug?: unknown
}) {
  const name = normalizeName(input.name)

  if (name.length < 2) {
    throw new Error('Nome da categoria é obrigatório.')
  }

  return {
    description: normalizeDescription(input.description),
    name,
    parentId: normalizeParentId(input.parentId),
    slug: await generateUniqueSlug({
      currentId: input.currentId,
      fallback: 'categoria',
      source: normalizeSlug(input.slug) || name,
      table: 'listing_categories',
    }),
  }
}

async function fetchCategoryRecords(admin: AdminClient) {
  const { data, error } = await admin.from('listing_categories').select('id, parent_id, sort_order')

  if (error) {
    throw error
  }

  return (data ?? []) as CategoryRecord[]
}

function buildChildMap(records: CategoryRecord[]) {
  const childMap = new Map<string, string[]>()

  for (const record of records) {
    if (!record.parent_id) {
      continue
    }

    const current = childMap.get(record.parent_id) ?? []
    current.push(record.id)
    childMap.set(record.parent_id, current)
  }

  return childMap
}

function collectDescendants(categoryId: string, childMap: Map<string, string[]>) {
  const descendants = new Set<string>()
  const stack = [...(childMap.get(categoryId) ?? [])]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (descendants.has(current)) {
      continue
    }

    descendants.add(current)
    stack.push(...(childMap.get(current) ?? []))
  }

  return descendants
}

async function resolveParentAndCycleCheck(input: {
  admin: AdminClient
  categoryId?: string | null
  parentId: string | null
}) {
  if (!input.parentId) {
    return
  }

  if (input.categoryId && input.categoryId === input.parentId) {
    throw new Error('Uma categoria não pode ser pai de si mesma.')
  }

  const records = await fetchCategoryRecords(input.admin)
  const parentExists = records.some((record) => record.id === input.parentId)

  if (!parentExists) {
    throw new Error('Categoria pai não encontrada.')
  }

  if (input.categoryId) {
    const descendants = collectDescendants(input.categoryId, buildChildMap(records))

    if (descendants.has(input.parentId)) {
      throw new Error('A categoria pai precisa estar fora da própria subárvore.')
    }
  }
}

async function resolveNextSortOrder(admin: AdminClient, parentId: string | null) {
  let query = admin
    .from('listing_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  if (parentId === null) {
    query = query.is('parent_id', null)
  } else {
    query = query.eq('parent_id', parentId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data?.[0]?.sort_order ?? -1) + 1
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

      await resolveParentAndCycleCheck({
        admin,
        parentId: normalized.parentId,
      })

      const nextSortOrder = await resolveNextSortOrder(admin, normalized.parentId)
      const { data: category, error: createError } = await admin
        .from('listing_categories')
        .insert({
          description: normalized.description,
          is_active: true,
          name: normalized.name,
          parent_id: normalized.parentId,
          slug: normalized.slug,
          sort_order: nextSortOrder,
        })
        .select('id')
        .single()

      if (createError || !category) {
        throw createError ?? new Error('Não foi possível criar a categoria.')
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
        return jsonResponse({ error: 'ID da categoria é obrigatório.' }, 400)
      }

      const { data: existing, error: existingError } = await admin
        .from('listing_categories')
        .select('id, name, slug, description, is_active, parent_id, sort_order')
        .eq('id', id)
        .single()

      if (existingError || !existing) {
        return jsonResponse({ error: 'Categoria não encontrada.' }, 404)
      }

      const normalized = await buildCategoryPayload({
        currentId: id,
        description: payload.description,
        name: payload.name,
        parentId: payload.parentId,
        slug: payload.slug,
      })
      const nextIsActive =
        typeof payload.isActive === 'boolean' ? payload.isActive : existing.is_active

      await resolveParentAndCycleCheck({
        admin,
        categoryId: id,
        parentId: normalized.parentId,
      })

      const parentChanged = normalized.parentId !== existing.parent_id
      const nextSortOrder = parentChanged
        ? await resolveNextSortOrder(admin, normalized.parentId)
        : existing.sort_order

      const { error: updateError } = await admin
        .from('listing_categories')
        .update({
          description: normalized.description,
          is_active: nextIsActive,
          name: normalized.name,
          parent_id: normalized.parentId,
          slug: normalized.slug,
          sort_order: nextSortOrder,
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
          parent_id: normalized.parentId,
          slug: normalized.slug,
          sort_order: nextSortOrder,
        },
        entityId: id,
        entityType: 'listing_category',
      })

      return jsonResponse({ categoryId: id, success: true })
    }

    if (payload.mode === 'reorder') {
      const orderedIds = Array.isArray(payload.orderedIds) ? payload.orderedIds : []
      const parentId = normalizeParentId(payload.parentId)

      if (orderedIds.length === 0) {
        return jsonResponse({ error: 'orderedIds é obrigatório.' }, 400)
      }

      const { data: categories, error: categoriesError } = await admin
        .from('listing_categories')
        .select('id, parent_id')
        .order('sort_order', { ascending: true })

      if (categoriesError) {
        throw categoriesError
      }

      const siblingIds = (categories ?? [])
        .filter((category) => (parentId ? category.parent_id === parentId : category.parent_id === null))
        .map((category) => category.id)

      if (
        siblingIds.length !== orderedIds.length ||
        siblingIds.some((categoryId) => !orderedIds.includes(categoryId))
      ) {
        return jsonResponse(
          { error: 'orderedIds deve corresponder às categorias irmãs do mesmo nível.' },
          422,
        )
      }

      for (const [index, categoryId] of orderedIds.entries()) {
        const { error: reorderError } = await admin
          .from('listing_categories')
          .update({ sort_order: index })
          .eq('id', categoryId)

        if (reorderError) {
          throw reorderError
        }
      }

      await insertAdminAuditLog({
        action: 'reorder_listing_categories',
        actorUserId: actor.id,
        afterData: {
          ordered_ids: orderedIds,
          parent_id: parentId,
        },
        entityType: 'listing_category',
      })

      return jsonResponse({ success: true })
    }

    const id = typeof payload.id === 'string' ? payload.id.trim() : ''

    if (!id) {
      return jsonResponse({ error: 'ID da categoria é obrigatório.' }, 400)
    }

    const { data: existing, error: existingError } = await admin
      .from('listing_categories')
      .select('id, name, slug, description, is_active, parent_id, sort_order')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return jsonResponse({ error: 'Categoria não encontrada.' }, 404)
    }

    const [{ count, error: linkedError }, { data: children, error: childrenError }] =
      await Promise.all([
        admin
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', id),
        admin.from('listing_categories').select('id').eq('parent_id', id).limit(1),
      ])

    if (linkedError) {
      throw linkedError
    }

    if (childrenError) {
      throw childrenError
    }

    if ((children?.length ?? 0) > 0) {
      return jsonResponse(
        {
          error: 'Esta categoria possui subcategorias. Realoque ou exclua as filhas antes de remover.',
        },
        409,
      )
    }

    if ((count ?? 0) > 0) {
      return jsonResponse(
        {
          error: 'Esta categoria possui anúncios vinculados. Desative-a em vez de excluir.',
        },
        409,
      )
    }

    const { error: deleteError } = await admin.from('listing_categories').delete().eq('id', id)

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
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
