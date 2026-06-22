/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

const LISTING_MEDIA_BUCKET = 'listing-media'

type LifecycleAction = 'archive' | 'delete' | 'pause'

type RequestBody = {
  action?: LifecycleAction
  listingId?: string
}

function resolveNextStatus(input: {
  action: LifecycleAction
  currentStatus: string
}) {
  if (input.action === 'pause') {
    if (input.currentStatus !== 'approved') {
      return {
        error: 'Only approved listings can be paused.',
        nextStatus: null,
        statusCode: 409,
      }
    }

    return {
      error: null,
      nextStatus: 'paused',
      statusCode: 200,
    }
  }

  if (input.currentStatus === 'archived') {
    return {
      error: 'O anúncio já está arquivado.',
      nextStatus: null,
      statusCode: 409,
    }
  }

  return {
    error: null,
    nextStatus: 'archived',
    statusCode: 200,
  }
}

async function removeListingStorageFiles(admin: ReturnType<typeof createAdminClient>, listingId: string) {
  const { data: images, error: imagesError } = await admin
    .from('listing_images')
    .select('storage_path')
    .eq('listing_id', listingId)

  if (imagesError) {
    throw imagesError
  }

  const storagePaths = (images ?? [])
    .map((image) => image.storage_path)
    .filter((storagePath): storagePath is string => typeof storagePath === 'string' && storagePath.length > 0)

  if (storagePaths.length === 0) {
    return
  }

  for (let index = 0; index < storagePaths.length; index += 100) {
    const batch = storagePaths.slice(index, index + 100)
    const { error: storageError } = await admin.storage.from(LISTING_MEDIA_BUCKET).remove(batch)

    if (storageError) {
      throw storageError
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { action, listingId } = (await request.json()) as RequestBody

    if (!listingId || (action !== 'pause' && action !== 'archive' && action !== 'delete')) {
      return jsonResponse({ error: 'listingId e action são obrigatórios.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, status, slug, rejection_reason, title')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Anúncio não encontrado.' }, 404)
    }

    if (action === 'delete' && actor.role !== 'admin') {
      return jsonResponse({ error: 'A exclusão permanente só pode ser feita por administradores.' }, 403)
    }

    if (actor.role !== 'admin' && listing.user_id !== actor.id) {
      return jsonResponse({ error: 'Você não pode gerenciar este anúncio.' }, 403)
    }

    if (action === 'delete') {
      await removeListingStorageFiles(admin, listingId)

      const { error: deleteError } = await admin.from('listings').delete().eq('id', listingId)

      if (deleteError) {
        throw deleteError
      }

      await insertAdminAuditLog({
        action: 'delete_listing',
        actorUserId: actor.id,
        afterData: {
          deleted: true,
        },
        beforeData: {
          rejection_reason: listing.rejection_reason,
          slug: listing.slug,
          status: listing.status,
          title: listing.title,
        },
        entityId: listingId,
        entityType: 'listing',
      })
      await enqueueTransactionalNotification({
        actionUrl: '/app/anuncios',
        body: `Seu anúncio "${listing.title}" foi excluído permanentemente pela equipe administrativa.`,
        category: 'listing_status',
        title: 'Anúncio excluído',
        userId: listing.user_id,
      })

      return jsonResponse({
        listingId,
        status: 'deleted',
        success: true,
      })
    }

    const transition = resolveNextStatus({
      action,
      currentStatus: listing.status,
    })

    if (transition.error || !transition.nextStatus) {
      return jsonResponse({ error: transition.error }, transition.statusCode)
    }

    const { error: updateError } = await admin
      .from('listings')
      .update({
        status: transition.nextStatus,
      })
      .eq('id', listingId)

    if (updateError) {
      throw updateError
    }

    await insertAdminAuditLog({
      action: action === 'pause' ? 'pause_listing' : 'archive_listing',
      actorUserId: actor.id,
      afterData: {
        status: transition.nextStatus,
      },
      beforeData: {
        rejection_reason: listing.rejection_reason,
        slug: listing.slug,
        status: listing.status,
      },
      entityId: listingId,
      entityType: 'listing',
    })
    await enqueueTransactionalNotification({
      actionUrl: '/app/anuncios',
      body: `Seu anúncio "${listing.title}" foi ${transition.nextStatus === 'paused' ? 'pausado' : 'arquivado'}.`,
      category: 'listing_status',
      title: transition.nextStatus === 'paused' ? 'Anúncio pausado' : 'Anúncio arquivado',
      userId: listing.user_id,
    })

    return jsonResponse({
      listingId,
      status: transition.nextStatus,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

