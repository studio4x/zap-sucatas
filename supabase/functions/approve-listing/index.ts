/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { notifyListingStatus } from '../_shared/notify.ts'
import { generateUniqueListingSlug } from '../_shared/slug.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  listingId?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminProfile = await requireAdminProfile(request)
    const { listingId } = (await request.json()) as RequestBody

    if (!listingId) {
      return jsonResponse({ error: 'listingId is required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, title, status, slug')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    const slug = listing.slug ?? (await generateUniqueListingSlug(listing.title, listing.id))
    const publishedAt = new Date().toISOString()
    const { error: updateError } = await admin
      .from('listings')
      .update({
        status: 'approved',
        slug,
        published_at: publishedAt,
        rejection_reason: null,
      })
      .eq('id', listingId)

    if (updateError) {
      throw updateError
    }

    await insertAdminAuditLog({
      action: 'approve_listing',
      actorUserId: adminProfile.id,
      beforeData: { status: listing.status, slug: listing.slug },
      afterData: { status: 'approved', slug, published_at: publishedAt },
      entityId: listingId,
      entityType: 'listing',
    })

    await notifyListingStatus({
      listingId,
      status: 'approved',
    })

    return jsonResponse({
      listingId,
      publishedAt,
      slug,
      status: 'approved',
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
