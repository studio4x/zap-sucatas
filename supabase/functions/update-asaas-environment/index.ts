/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  mode?: 'production' | 'sandbox'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const { mode } = (await request.json()) as RequestBody

    if (mode !== 'sandbox' && mode !== 'production') {
      return jsonResponse({ error: 'mode must be sandbox or production.' }, 400)
    }

    const admin = createAdminClient()
    const { data: settings, error: selectError } = await admin
      .from('system_settings')
      .select('id')
      .limit(1)
      .single()

    if (selectError || !settings) {
      throw selectError ?? new Error('Configurações do sistema não encontradas.')
    }

    const { error: updateError } = await admin
      .from('system_settings')
      .update({
        asaas_environment: mode,
      })
      .eq('id', settings.id)

    if (updateError) {
      throw updateError
    }

    return jsonResponse({
      mode,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})


