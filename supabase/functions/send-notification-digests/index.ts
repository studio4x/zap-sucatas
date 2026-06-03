/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { resolveHttpErrorStatus, requireAdminProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    await requireAdminProfile(request)
    const admin = createAdminClient()
    const { data: prefs, error } = await admin
      .from('notification_preferences')
      .select('user_id, email_digest, email_enabled')
      .in('email_digest', ['daily', 'weekly'])
      .eq('email_enabled', true)

    if (error) {
      throw error
    }

    let generated = 0
    for (const pref of prefs ?? []) {
      const since = pref.email_digest === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', pref.user_id)
        .is('read_at', null)
        .gte('created_at', since)

      if (!count || count <= 0) continue

      const { data: notification } = await admin
        .from('notifications')
        .insert({
          user_id: pref.user_id,
          title: 'Resumo de notificações',
          body: `Você recebeu ${count} notificações não lidas no período.`,
          category: 'digest',
          priority: 'low',
          is_actionable: true,
          action_url: '/app/notificacoes',
        })
        .select('id')
        .single()

      if (!notification) continue
      await admin.from('notification_queue').insert({
        notification_id: notification.id,
        user_id: pref.user_id,
        channel: 'email',
        title: 'Resumo de notificações',
        body: `Você recebeu ${count} notificações não lidas no período.`,
        category: 'digest',
        priority: 'low',
        payload: { dispatch_type: 'digest', digest_type: pref.email_digest },
      })
      generated += 1
    }

    return jsonResponse({ generated, success: true })
  } catch (error) {
    const status = resolveHttpErrorStatus(error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, status === 500 ? 400 : status)
  }
})
