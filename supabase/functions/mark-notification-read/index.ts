/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  channel?: 'email' | 'in-app' | 'push' | 'whatsapp'
  mark_all?: boolean
  notification_id?: string
}

function addChannelToReadList(input: unknown, channel: RequestBody['channel']) {
  if (!channel) {
    return input
  }

  const current = Array.isArray(input)
    ? input.filter((value): value is string => typeof value === 'string')
    : []

  if (current.includes(channel)) {
    return current
  }

  return [...current, channel]
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const profile = await requireActiveProfile(request)
    const admin = createAdminClient()
    const payload = (await request.json()) as RequestBody

    const markAll = payload.mark_all === true
    const notificationId = typeof payload.notification_id === 'string' ? payload.notification_id.trim() : ''

    if (!markAll && !notificationId) {
      throw new Error('Informe notification_id ou mark_all=true.')
    }

    if (markAll) {
      const { error } = await admin
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id)
        .is('read_at', null)

      if (error) {
        throw error
      }

      return jsonResponse({ success: true })
    }

    const { data: notification, error: notificationError } = await admin
      .from('notifications')
      .select('id, user_id, read_by_channels')
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .single()

    if (notificationError || !notification) {
      throw notificationError ?? new Error('Notificacao nao encontrada.')
    }

    const nextReadByChannels = addChannelToReadList(notification.read_by_channels, payload.channel)

    const { error: updateError } = await admin
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
        read_by_channels: nextReadByChannels,
      })
      .eq('id', notification.id)

    if (updateError) {
      throw updateError
    }

    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 400)
  }
})
