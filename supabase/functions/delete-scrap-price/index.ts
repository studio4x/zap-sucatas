/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const payload = (await request.json()) as { id?: string }

    if (!payload.id) {
      return jsonResponse({ error: 'ID é obrigatório.' }, 400)
    }

    const admin = createAdminClient()
    const { error } = await admin.from('scrap_price_items').delete().eq('id', payload.id)
    if (error) throw error

    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

