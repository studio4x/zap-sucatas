/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { getBearerToken } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type NotifyType = 'new_message' | 'new_ticket' | 'ticket_closed'

type RequestBody = {
  access_token?: string
  messageId?: string | null
  ticketId?: string
  type?: NotifyType
}

async function requireActor(request: Request) {
  const token = await getBearerToken(request)
  const admin = createAdminClient()
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    throw new Error('Sessao invalida para notificacao de suporte.')
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, auth_user_id, full_name, role, status')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile || profile.status !== 'active') {
    throw new Error('Perfil ativo nao encontrado para notificacao de suporte.')
  }

  return profile
}

function validatePayload(payload: RequestBody) {
  const ticketId = typeof payload.ticketId === 'string' ? payload.ticketId.trim() : ''
  const type = payload.type

  if (!ticketId) {
    throw new Error('ticketId e obrigatorio.')
  }

  if (type !== 'new_ticket' && type !== 'new_message' && type !== 'ticket_closed') {
    throw new Error('Tipo de notificacao invalido.')
  }

  return {
    messageId: typeof payload.messageId === 'string' ? payload.messageId.trim() : null,
    ticketId,
    type,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const payload = validatePayload((await request.json()) as RequestBody)
    const actor = await requireActor(request)

    if (payload.type === 'ticket_closed' && actor.role !== 'admin') {
      return jsonResponse({ error: 'Apenas admins podem disparar ticket_closed.' }, 403)
    }

    await insertIntegrationLog({
      integrationName: 'support_notifications',
      message: `Support event queued: ${payload.type}`,
      payload: {
        actorProfileId: actor.id,
        actorRole: actor.role,
        messageId: payload.messageId,
        ticketId: payload.ticketId,
        type: payload.type,
      },
      status: 'queued',
    })

    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    await insertIntegrationLog({
      integrationName: 'support_notifications',
      message,
      payload: {
        event: 'support_notification_failed',
        severity: 'danger',
      },
      status: 'error',
    })
    return jsonResponse({ error: message }, 400)
  }
})
