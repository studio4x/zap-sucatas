/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

function parseBoolean(value: string | null, defaultValue: boolean) {
  if (value === null) {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const profile = await requireActiveProfile(request)
    const admin = createAdminClient()

    const url = new URL(request.url)
    const limitParam = Number(url.searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 1000)) : 20
    const unreadOnly = parseBoolean(url.searchParams.get('unread_only'), false)
    const category = url.searchParams.get('category')?.trim().toLowerCase() ?? ''

    let notificationsQuery = admin
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      notificationsQuery = notificationsQuery.is('read_at', null)
    }

    if (category) {
      notificationsQuery = notificationsQuery.eq('category', category)
    }

    const [{ data: notifications, error: notificationsError }, { count: total, error: totalError }, { count: unreadCount, error: unreadError }] =
      await Promise.all([
        notificationsQuery,
        admin
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        admin
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .is('read_at', null),
      ])

    if (notificationsError || totalError || unreadError) {
      throw notificationsError ?? totalError ?? unreadError
    }

    return jsonResponse({
      notifications: notifications ?? [],
      total: total ?? 0,
      unread_count: unreadCount ?? 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    const status = resolveHttpErrorStatus(error)
    return jsonResponse({ error: message }, status === 500 ? 400 : status)
  }
})

