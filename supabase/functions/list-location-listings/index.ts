/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type ListingRow = {
  city: string
  id: string
  state: string
  status: string
  title: string
  updated_at: string
}

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
    const { data, error } = await admin
      .from('listings')
      .select('id, title, city, state, status, updated_at')
      .eq('state', state)
      .ilike('city', city)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    const items = ((data ?? []) as ListingRow[]).filter((row) => normalizeCity(row.city).toLowerCase() === city.toLowerCase())

    return jsonResponse({ items, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

