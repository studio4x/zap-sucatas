/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { notifyListingStatus } from '../_shared/notify.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  listingId?: string
  reason?: string
  status?: 'approved' | 'pending_review' | 'rejected'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { listingId, reason, status } = (await request.json()) as RequestBody

    if (!listingId || !status) {
      return jsonResponse({ error: 'listingId and status are required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error } = await admin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single()

    if (error || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (actor.role !== 'admin' && listing.user_id !== actor.id) {
      return jsonResponse({ error: 'You cannot notify this listing.' }, 403)
    }

    const result = await notifyListingStatus({
      listingId,
      reason,
      status,
    })

    return jsonResponse({
      ...result,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
