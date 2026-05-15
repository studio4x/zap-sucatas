/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type LifecycleAction = 'archive' | 'pause'

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
      error: 'Listing is already archived.',
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { action, listingId } = (await request.json()) as RequestBody

    if (!listingId || (action !== 'pause' && action !== 'archive')) {
      return jsonResponse({ error: 'listingId and action are required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, status, slug, rejection_reason, title')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (actor.role !== 'admin' && listing.user_id !== actor.id) {
      return jsonResponse({ error: 'You cannot manage this listing.' }, 403)
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
      body: `Seu anuncio "${listing.title}" foi ${transition.nextStatus === 'paused' ? 'pausado' : 'arquivado'}.`,
      category: 'listing_status',
      title: transition.nextStatus === 'paused' ? 'Anuncio pausado' : 'Anuncio arquivado',
      userId: listing.user_id,
    })

    return jsonResponse({
      listingId,
      status: transition.nextStatus,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
