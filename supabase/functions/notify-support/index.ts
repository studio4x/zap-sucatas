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

type ProfileRow = {
  id: string
  role: string
}

type TicketRow = {
  id: string
  subject: string
  user_id: string
}

type SupportMessageRow = {
  id: string
  sender_id: string
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

async function resolveRecipients(input: {
  actorId: string
  messageId: string | null
  ticketId: string
  type: NotifyType
}) {
  const admin = createAdminClient()
  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('id, subject, user_id')
    .eq('id', input.ticketId)
    .single<TicketRow>()

  if (ticketError || !ticket) {
    throw new Error('Chamado de suporte nao encontrado.')
  }

  const { data: admins, error: adminsError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('role', 'admin')
    .eq('status', 'active')
    .returns<ProfileRow[]>()

  if (adminsError) {
    throw adminsError
  }

  const adminIds = (admins ?? []).map((profile) => profile.id)
  const recipientSet = new Set<string>()
  let title = 'Atualizacao em chamado de suporte'
  let body = `O chamado "${ticket.subject}" recebeu uma atualizacao.`

  if (input.type === 'new_ticket') {
    title = 'Novo chamado de suporte'
    body = `Um novo chamado foi aberto: "${ticket.subject}".`
    adminIds.filter((id) => id !== input.actorId).forEach((id) => recipientSet.add(id))
  }

  if (input.type === 'new_message') {
    if (!input.messageId) {
      throw new Error('messageId e obrigatorio para new_message.')
    }

    const { data: message, error: messageError } = await admin
      .from('support_messages')
      .select('id, sender_id')
      .eq('id', input.messageId)
      .single<SupportMessageRow>()

    if (messageError || !message) {
      throw new Error('Mensagem de suporte nao encontrada.')
    }

    if (adminIds.includes(message.sender_id)) {
      title = 'Suporte respondeu seu chamado'
      body = `Seu chamado "${ticket.subject}" recebeu uma resposta da equipe.`
      if (ticket.user_id !== message.sender_id) {
        recipientSet.add(ticket.user_id)
      }
    } else {
      title = 'Novo retorno do usuario no suporte'
      body = `O chamado "${ticket.subject}" recebeu uma nova mensagem do usuario.`
      adminIds.filter((id) => id !== message.sender_id).forEach((id) => recipientSet.add(id))
    }
  }

  if (input.type === 'ticket_closed') {
    title = 'Chamado encerrado'
    body = `Seu chamado "${ticket.subject}" foi encerrado.`
    if (ticket.user_id !== input.actorId) {
      recipientSet.add(ticket.user_id)
    }
  }

  return {
    actionUrl: `/app/suporte/${ticket.id}`,
    body,
    category: 'support',
    priority: 'normal' as const,
    recipients: Array.from(recipientSet),
    title,
  }
}

async function enqueueSupportNotifications(input: {
  actionUrl: string
  body: string
  category: string
  priority: 'normal'
  recipients: string[]
  title: string
}) {
  if (input.recipients.length === 0) {
    return { notificationCount: 0, queuedCount: 0 }
  }

  const admin = createAdminClient()
  const notificationsPayload = input.recipients.map((userId) => ({
    user_id: userId,
    title: input.title,
    body: input.body,
    action_url: input.actionUrl,
    category: input.category,
    priority: input.priority,
    is_actionable: true,
  }))

  const { data: inserted, error: insertError } = await admin
    .from('notifications')
    .insert(notificationsPayload)
    .select('id, user_id, title, body, category, priority')

  if (insertError) {
    throw insertError
  }

  const queuePayload = (inserted ?? []).flatMap((notification) => ([
    {
      notification_id: notification.id,
      user_id: notification.user_id,
      channel: 'in-app',
      title: notification.title,
      body: notification.body,
      category: notification.category,
      priority: notification.priority,
      payload: { source: 'support', type: 'transactional' },
    },
    {
      notification_id: notification.id,
      user_id: notification.user_id,
      channel: 'email',
      title: notification.title,
      body: notification.body,
      category: notification.category,
      priority: notification.priority,
      payload: { source: 'support', type: 'transactional' },
    },
  ]))

  const { error: queueError } = await admin
    .from('notification_queue')
    .insert(queuePayload)

  if (queueError) {
    throw queueError
  }

  return {
    notificationCount: inserted?.length ?? 0,
    queuedCount: queuePayload.length,
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

    const notificationInput = await resolveRecipients({
      actorId: actor.id,
      messageId: payload.messageId,
      ticketId: payload.ticketId,
      type: payload.type,
    })

    const enqueueResult = await enqueueSupportNotifications(notificationInput)

    await insertIntegrationLog({
      integrationName: 'support_notifications',
      message: `Support event processed: ${payload.type}`,
      payload: {
        actorProfileId: actor.id,
        actorRole: actor.role,
        messageId: payload.messageId,
        notificationCount: enqueueResult.notificationCount,
        queuedCount: enqueueResult.queuedCount,
        recipients: notificationInput.recipients,
        ticketId: payload.ticketId,
        type: payload.type,
      },
      status: 'success',
    })

    return jsonResponse({ success: true, ...enqueueResult })
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
