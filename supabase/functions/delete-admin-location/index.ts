/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

function normalizeState(value: string) {
  return value.trim().toUpperCase().slice(0, 2)
}

function normalizeCity(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const payload = (await request.json()) as { city?: string; state?: string }
    const state = normalizeState(payload.state ?? '')
    const city = normalizeCity(payload.city ?? '')

    if (state.length !== 2 || city.length < 2) {
      return jsonResponse({ error: 'Localidade invalida.' }, 400)
    }

    const admin = createAdminClient()
    const { error } = await admin.from('admin_listing_localities').upsert(
      {
        city,
        is_active: false,
        state,
      },
      { onConflict: 'state,city' },
    )

    if (error) {
      throw error
    }

    return jsonResponse({ city, state, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
