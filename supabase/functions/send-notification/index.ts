/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog, insertIntegrationLog } from '../_shared/logging.ts'
import { normalizeChannels } from '../_shared/notifications.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  access_token?: string
  action_url?: string | null
  body?: string
  category?: string
  channels?: string[]
  priority?: 'high' | 'low' | 'normal' | 'urgent'
  title?: string
  target?: 'all' | 'users'
  user_id?: string
  user_ids?: string[]
}

type NotificationPreferenceRow = {
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
  user_id: string
  whatsapp_enabled: boolean
}

function validatePayload(payload: RequestBody) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!title || !body) {
    throw new Error('title e body são obrigatórios.')
  }

  if (title.length > 200) {
    throw new Error('title deve ter no máximo 200 caracteres.')
  }

  const category = typeof payload.category === 'string' && payload.category.trim().length > 0
    ? payload.category.trim().toLowerCase()
    : 'system'

  const priority = payload.priority === 'low' || payload.priority === 'high' || payload.priority === 'urgent'
    ? payload.priority
    : 'normal'

  const channels = normalizeChannels(payload.channels)
  const actionUrl = typeof payload.action_url === 'string' && payload.action_url.trim().length > 0
    ? payload.action_url.trim()
    : null

  const directUserId = typeof payload.user_id === 'string' && payload.user_id.trim().length > 0
    ? payload.user_id.trim()
    : null

  const userIds = Array.isArray(payload.user_ids)
    ? payload.user_ids
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0)
    : []

  const target = payload.target === 'all' ? 'all' : 'users'

  return {
    actionUrl,
    body,
    category,
    channels,
    directUserId,
    priority,
    target,
    title,
    userIds,
  }
}

async function resolveTargetUsers(input: {
  directUserId: string | null
  target: 'all' | 'users'
  userIds: string[]
}) {
  const admin = createAdminClient()

  if (input.target === 'all') {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('status', 'active')

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => row.id)
  }

  const resolved = new Set<string>()

  if (input.directUserId) {
    resolved.add(input.directUserId)
  }

  for (const userId of input.userIds) {
    resolved.add(userId)
  }

  if (resolved.size === 0) {
    throw new Error('Informe user_id, user_ids ou target=all.')
  }

  return Array.from(resolved)
}

function channelEnabledForPreference(channel: string, preference: NotificationPreferenceRow | null) {
  if (!preference) {
    return true
  }

  if (channel === 'push') {
    return preference.push_enabled
  }

  if (channel === 'email') {
    return preference.email_enabled
  }

  if (channel === 'whatsapp') {
    return preference.whatsapp_enabled
  }

  return preference.in_app_enabled
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const actor = await requireAdminProfile(request)
    const payload = validatePayload((await request.json()) as RequestBody)
    const targetUsers = await resolveTargetUsers({
      directUserId: payload.directUserId,
      target: payload.target,
      userIds: payload.userIds,
    })

    if (targetUsers.length === 0) {
      return jsonResponse({ notification_count: 0, queued_count: 0, success: true })
    }

    const admin = createAdminClient()
    const { data: preferences, error: preferencesError } = await admin
      .from('notification_preferences')
      .select('user_id, push_enabled, email_enabled, whatsapp_enabled, in_app_enabled')
      .in('user_id', targetUsers)

    if (preferencesError) {
      throw preferencesError
    }

    const preferenceMap = new Map((preferences ?? []).map((row) => [row.user_id, row as NotificationPreferenceRow]))

    let notificationCount = 0
    let queuedCount = 0

    for (const userId of targetUsers) {
      const { data: notificationRow, error: notificationError } = await admin
        .from('notifications')
        .insert({
          action_url: payload.actionUrl,
          body: payload.body,
          category: payload.category,
          is_actionable: Boolean(payload.actionUrl),
          priority: payload.priority,
          title: payload.title,
          user_id: userId,
        })
        .select('id')
        .single()

      if (notificationError || !notificationRow) {
        throw notificationError ?? new Error('Não foi possível inserir notificação.')
      }

      notificationCount += 1

      const preference = preferenceMap.get(userId) ?? null
      const queueRows = payload.channels
        .filter((channel) => channelEnabledForPreference(channel, preference))
        .map((channel) => ({
          body: payload.body,
          category: payload.category,
          channel,
          notification_id: notificationRow.id,
          payload: {
            action_url: payload.actionUrl,
            category: payload.category,
            dispatch_origin: 'manual',
            dispatch_type: 'admin_broadcast',
            notification_id: notificationRow.id,
            priority: payload.priority,
            title: payload.title,
          },
          priority: payload.priority,
          title: payload.title,
          user_id: userId,
        }))

      if (queueRows.length > 0) {
        const { error: queueError } = await admin.from('notification_queue').insert(queueRows)

        if (queueError) {
          throw queueError
        }

        queuedCount += queueRows.length
      }
    }

    await insertAdminAuditLog({
      action: 'notifications.broadcast_send',
      actorUserId: actor.id,
      afterData: {
        category: payload.category,
        channels: payload.channels,
        notificationCount,
        priority: payload.priority,
        queuedCount,
        target: payload.target,
      },
      entityId: null,
      entityType: 'notifications',
    })

    await insertIntegrationLog({
      integrationName: 'notifications',
      message: `Notificações enfileiradas para ${targetUsers.length} users`,
      payload: {
        channels: payload.channels,
        notificationCount,
        queuedCount,
      },
      status: 'queued',
    })

    return jsonResponse({
      notification_count: notificationCount,
      queued_count: queuedCount,
      success: true,
      target_users: targetUsers.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    const status = resolveHttpErrorStatus(error)

    await insertIntegrationLog({
      integrationName: 'notifications',
      message,
      payload: {
        event: 'send_notification_failed',
      },
      status: 'error',
    })

    return jsonResponse({ error: message }, status === 500 ? 400 : status)
  }
})
