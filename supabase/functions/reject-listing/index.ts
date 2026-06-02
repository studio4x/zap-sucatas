/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { notifyListingStatus } from '../_shared/notify.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type RequestBody = {
  listingId?: string
  reason?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminProfile = await requireAdminProfile(request)
    const { listingId, reason } = (await request.json()) as RequestBody

    if (!listingId || !reason?.trim()) {
      return jsonResponse({ error: 'listingId and reason are required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, status, rejection_reason, user_id, title')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    const { error: updateError } = await admin
      .from('listings')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
      })
      .eq('id', listingId)

    if (updateError) {
      throw updateError
    }

    await insertAdminAuditLog({
      action: 'reject_listing',
      actorUserId: adminProfile.id,
      beforeData: { status: listing.status, rejection_reason: listing.rejection_reason },
      afterData: { status: 'rejected', rejection_reason: reason.trim() },
      entityId: listingId,
      entityType: 'listing',
    })

    await notifyListingStatus({
      listingId,
      reason: reason.trim(),
      status: 'rejected',
    })
    await enqueueTransactionalNotification({
      actionUrl: '/app/anuncios',
      body: `Seu anúncio "${listing.title}" foi reprovado. Motivo: ${reason.trim()}`,
      category: 'listing_status',
      title: 'Anúncio reprovado',
      userId: listing.user_id,
    })

    return jsonResponse({
      listingId,
      reason: reason.trim(),
      status: 'rejected',
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})