/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  coverImageId?: string | null
  listingId?: string
  orderedImageIds?: string[]
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { coverImageId, listingId, orderedImageIds } = (await request.json()) as RequestBody

    if (!listingId || !Array.isArray(orderedImageIds) || orderedImageIds.length === 0) {
      return jsonResponse({ error: 'listingId and orderedImageIds are required.' }, 400)
    }

    if (hasDuplicates(orderedImageIds)) {
      return jsonResponse({ error: 'orderedImageIds contains duplicated entries.' }, 422)
    }

    const admin = createAdminClient()
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (actor.role !== 'admin' && listing.user_id !== actor.id) {
      return jsonResponse({ error: 'You cannot manage this listing.' }, 403)
    }

    const { data: images, error: imageError } = await admin
      .from('listing_images')
      .select('id, sort_order, is_cover')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })

    if (imageError) {
      throw imageError
    }

    if (!images || images.length === 0) {
      return jsonResponse({ error: 'Listing has no images to reorder.' }, 409)
    }

    const existingIds = images.map((image) => image.id)

    if (
      existingIds.length !== orderedImageIds.length ||
      existingIds.some((imageId) => !orderedImageIds.includes(imageId))
    ) {
      return jsonResponse({ error: 'orderedImageIds must match the current listing images.' }, 422)
    }

    const nextCoverImageId =
      coverImageId && orderedImageIds.includes(coverImageId)
        ? coverImageId
        : images.find((image) => image.is_cover)?.id ?? orderedImageIds[0]

    const offsetBase = images.length + 1000

    for (const image of images) {
      const { error: offsetError } = await admin
        .from('listing_images')
        .update({
          sort_order: image.sort_order + offsetBase,
        })
        .eq('id', image.id)

      if (offsetError) {
        throw offsetError
      }
    }

    for (const [index, imageId] of orderedImageIds.entries()) {
      const { error: updateOrderError } = await admin
        .from('listing_images')
        .update({
          sort_order: index,
        })
        .eq('id', imageId)

      if (updateOrderError) {
        throw updateOrderError
      }
    }

    const { error: resetCoverError } = await admin
      .from('listing_images')
      .update({ is_cover: false })
      .eq('listing_id', listingId)

    if (resetCoverError) {
      throw resetCoverError
    }

    const { error: setCoverError } = await admin
      .from('listing_images')
      .update({ is_cover: true })
      .eq('id', nextCoverImageId)

    if (setCoverError) {
      throw setCoverError
    }

    await insertAdminAuditLog({
      action: 'reorder_listing_images',
      actorUserId: actor.id,
      afterData: {
        cover_image_id: nextCoverImageId,
        ordered_image_ids: orderedImageIds,
      },
      entityId: listingId,
      entityType: 'listing',
    })

    return jsonResponse({
      coverImageId: nextCoverImageId,
      listingId,
      orderedImageIds,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
