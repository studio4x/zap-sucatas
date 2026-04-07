/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { notifyListingStatus } from '../_shared/notify.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  listingId?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const profile = await requireActiveProfile(request)
    const { listingId } = (await request.json()) as RequestBody

    if (!listingId) {
      return jsonResponse({ error: 'listingId is required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, title, description, category_id, city, state, status')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (listing.user_id !== profile.id && profile.role !== 'admin') {
      return jsonResponse({ error: 'You do not own this listing.' }, 403)
    }

    if (!['draft', 'rejected', 'paused'].includes(listing.status)) {
      return jsonResponse({ error: 'Listing cannot be submitted from the current status.' }, 409)
    }

    const { data: images, error: imageError } = await admin
      .from('listing_images')
      .select('id')
      .eq('listing_id', listingId)
      .limit(1)

    if (imageError) {
      throw imageError
    }

    const missingFields = [
      !listing.title && 'title',
      !listing.description && 'description',
      !listing.category_id && 'category_id',
      !listing.city && 'city',
      !listing.state && 'state',
      (!images || images.length === 0) && 'images',
    ].filter(Boolean)

    if (missingFields.length > 0) {
      return jsonResponse({ error: 'Listing validation failed.', missingFields }, 422)
    }

    const { error: updateError } = await admin
      .from('listings')
      .update({
        status: 'pending_review',
        rejection_reason: null,
      })
      .eq('id', listingId)

    if (updateError) {
      throw updateError
    }

    await insertAdminAuditLog({
      action: 'submit_listing_for_review',
      actorUserId: profile.id,
      beforeData: { status: listing.status },
      afterData: { status: 'pending_review' },
      entityId: listingId,
      entityType: 'listing',
    })

    await notifyListingStatus({
      listingId,
      status: 'pending_review',
    })

    return jsonResponse({
      listingId,
      status: 'pending_review',
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
