/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { generateUniqueSlug } from '../_shared/slug.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type CreatePayload = {
  mode: 'create'
  name?: string
  slug?: string
}

type UpdatePayload = {
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

type RequestBody = CreatePayload | DeletePayload | UpdatePayload

function normalizeName(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ')
}

function normalizeSlug(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function buildMaterialPayload(input: {
  currentId?: string | null
  name?: unknown
  slug?: unknown
}) {
  const name = normalizeName(input.name)

  if (name.length < 2) {
    throw new Error('Nome do material é obrigatório.')
  }

  return {
    name,
    slug: await generateUniqueSlug({
      currentId: input.currentId,
      fallback: 'material',
      source: normalizeSlug(input.slug) || name,
      table: 'listing_materials',
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
      const normalized = await buildMaterialPayload(payload)
      const { data: material, error: createError } = await admin
        .from('listing_materials')
        .insert({
          is_active: true,
          name: normalized.name,
          slug: normalized.slug,
        })
        .select('id')
        .single()

      if (createError || !material) {
        throw createError ?? new Error('Não foi possível criar o material.')
      }

      await insertAdminAuditLog({
        action: 'create_listing_material',
        actorUserId: actor.id,
        afterData: {
          ...normalized,
          is_active: true,
        },
        entityId: material.id,
        entityType: 'listing_material',
      })

      return jsonResponse({ materialId: material.id, success: true })
    }

    if (payload.mode === 'update') {
      const id = typeof payload.id === 'string' ? payload.id.trim() : ''

      if (!id) {
        return jsonResponse({ error: 'ID do material é obrigatório.' }, 400)
      }

      const { data: existing, error: existingError } = await admin
        .from('listing_materials')
        .select('id, name, slug, is_active')
        .eq('id', id)
        .single()

      if (existingError || !existing) {
        return jsonResponse({ error: 'Material não encontrado.' }, 404)
      }

      const normalized = await buildMaterialPayload({
        currentId: id,
        name: payload.name,
        slug: payload.slug,
      })
      const nextIsActive =
        typeof payload.isActive === 'boolean' ? payload.isActive : existing.is_active

      const { error: updateError } = await admin
        .from('listing_materials')
        .update({
          is_active: nextIsActive,
          name: normalized.name,
          slug: normalized.slug,
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      await insertAdminAuditLog({
        action: 'update_listing_material',
        actorUserId: actor.id,
        beforeData: existing,
        afterData: {
          ...existing,
          is_active: nextIsActive,
          name: normalized.name,
          slug: normalized.slug,
        },
        entityId: id,
        entityType: 'listing_material',
      })

      return jsonResponse({ materialId: id, success: true })
    }

    const id = typeof payload.id === 'string' ? payload.id.trim() : ''

    if (!id) {
      return jsonResponse({ error: 'ID do material é obrigatório.' }, 400)
    }

    const { data: existing, error: existingError } = await admin
      .from('listing_materials')
      .select('id, name, slug, is_active')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return jsonResponse({ error: 'Material não encontrado.' }, 404)
    }

    const { count, error: linkedError } = await admin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('primary_material_id', id)

    if (linkedError) {
      throw linkedError
    }

    if ((count ?? 0) > 0) {
      return jsonResponse(
        {
          error: 'This material has linked listings. Inactivate it instead of deleting.',
        },
        409,
      )
    }

    const { error: deleteError } = await admin
      .from('listing_materials')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    await insertAdminAuditLog({
      action: 'delete_listing_material',
      actorUserId: actor.id,
      beforeData: existing,
      entityId: id,
      entityType: 'listing_material',
    })

    return jsonResponse({ materialId: id, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})


