import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { env } from '@/lib/env'
import type {
  NotificationCenterResponse,
  NotificationPreferences,
  NotificationQueueItem,
  NotificationQueuePage,
  NotificationQueueStats,
} from '@/domains/notifications/types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationPreferenceRow = Database['public']['Tables']['notification_preferences']['Row']
type NotificationQueueRow = Database['public']['Tables']['notification_queue']['Row']

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

function mapNotification(row: NotificationRow) {
  return {
    actionUrl: row.action_url,
    body: row.body,
    category: row.category,
    createdAt: row.created_at,
    id: row.id,
    isActionable: row.is_actionable,
    priority: row.priority as NotificationCenterResponse['notifications'][number]['priority'],
    readAt: row.read_at,
    readByChannels: Array.isArray(row.read_by_channels)
      ? row.read_by_channels.filter((value): value is string => typeof value === 'string')
      : [],
    title: row.title,
    userId: row.user_id,
  }
}

function mapNotificationPreference(row: NotificationPreferenceRow): NotificationPreferences {
  return {
    emailDigest: row.email_digest as NotificationPreferences['emailDigest'],
    emailEnabled: row.email_enabled,
    inAppEnabled: row.in_app_enabled,
    pushEnabled: row.push_enabled,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursEnd: row.quiet_hours_end,
    quietHoursStart: row.quiet_hours_start,
    quietHoursTimezone: row.quiet_hours_timezone,
    userId: row.user_id,
    whatsappEnabled: row.whatsapp_enabled,
  }
}

function mapQueueRow(row: NotificationQueueRow): NotificationQueueItem {
  return {
    attemptCount: row.attempt_count,
    body: row.body,
    category: row.category,
    channel: row.channel as NotificationQueueItem['channel'],
    createdAt: row.created_at,
    finalError: row.final_error,
    id: row.id,
    nextRetryAt: row.next_retry_at,
    notificationId: row.notification_id,
    payload: row.payload && typeof row.payload === 'object' ? row.payload as Record<string, unknown> : {},
    priority: row.priority as NotificationQueueItem['priority'],
    providerMessageId: row.provider_message_id,
    status: row.status as NotificationQueueItem['status'],
    title: row.title,
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessao invalida. Faca login novamente.')
    }

    return session.access_token
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  return data.session?.access_token ?? session.access_token ?? ''
}

async function callEdgeFunction<TResponse>(input: {
  body?: Record<string, unknown>
  method?: 'GET' | 'POST'
  name: string
  queryParams?: URLSearchParams
}) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Variaveis do Supabase nao configuradas para Edge Functions.')
  }

  const accessToken = await getFreshAccessToken()
  if (!accessToken) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  const query = input.queryParams ? `?${input.queryParams.toString()}` : ''
  const response = await fetch(`${env.supabaseUrl}/functions/v1/${input.name}${query}`, {
    body: input.method === 'GET' ? undefined : JSON.stringify({ access_token: accessToken, ...(input.body ?? {}) }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    method: input.method ?? 'POST',
  })

  const payload = (await response.json()) as TResponse & { error?: string }

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? 'Falha ao executar acao de notificacao.')
  }

  return payload
}

export async function fetchNotificationCenter(input?: {
  category?: string
  limit?: number
  unreadOnly?: boolean
}): Promise<NotificationCenterResponse> {
  const queryParams = new URLSearchParams()

  queryParams.set('limit', String(input?.limit ?? 20))
  queryParams.set('unread_only', input?.unreadOnly ? 'true' : 'false')

  if (input?.category) {
    queryParams.set('category', input.category)
  }

  const result = await callEdgeFunction<{
    notifications: NotificationRow[]
    total: number
    unread_count: number
  }>({
    method: 'GET',
    name: 'get-notifications',
    queryParams,
  })

  return {
    notifications: (result.notifications ?? []).map(mapNotification),
    total: result.total ?? 0,
    unreadCount: result.unread_count ?? 0,
  }
}

export async function fetchUnreadNotificationsCount() {
  const result = await fetchNotificationCenter({ limit: 1, unreadOnly: false })
  return result.unreadCount
}

export async function markNotificationAsRead(notificationId: string, channel: NotificationQueueItem['channel'] | null = null) {
  await callEdgeFunction<{ success: boolean }>({
    body: {
      channel,
      notification_id: notificationId,
    },
    method: 'POST',
    name: 'mark-notification-read',
  })
}

export async function markAllNotificationsAsRead() {
  await callEdgeFunction<{ success: boolean }>({
    body: { mark_all: true },
    method: 'POST',
    name: 'mark-notification-read',
  })
}

export async function fetchNotificationPreferences(profileId: string) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('notification_preferences')
    .select('*')
    .eq('user_id', profileId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    const { data: inserted, error: insertError } = await client
      .from('notification_preferences')
      .insert({ user_id: profileId })
      .select('*')
      .single()

    if (insertError || !inserted) {
      throw insertError ?? new Error('Nao foi possivel inicializar as preferencias de notificacao.')
    }

    return mapNotificationPreference(inserted as NotificationPreferenceRow)
  }

  return mapNotificationPreference(data as NotificationPreferenceRow)
}

export async function updateNotificationPreferences(input: {
  emailDigest: NotificationPreferences['emailDigest']
  emailEnabled: boolean
  inAppEnabled: boolean
  profileId: string
  pushEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursEnd: string | null
  quietHoursStart: string | null
  quietHoursTimezone: string
  whatsappEnabled: boolean
}) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('notification_preferences')
    .update({
      email_digest: input.emailDigest,
      email_enabled: input.emailEnabled,
      in_app_enabled: input.inAppEnabled,
      push_enabled: input.pushEnabled,
      quiet_hours_enabled: input.quietHoursEnabled,
      quiet_hours_end: input.quietHoursEnd,
      quiet_hours_start: input.quietHoursStart,
      quiet_hours_timezone: input.quietHoursTimezone,
      whatsapp_enabled: input.whatsappEnabled,
    })
    .eq('user_id', input.profileId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Nao foi possivel salvar as preferencias de notificacao.')
  }

  return mapNotificationPreference(data as NotificationPreferenceRow)
}

export async function sendNotificationBroadcast(input: {
  actionUrl?: string | null
  body: string
  category: string
  channels: Array<'email' | 'in-app' | 'push' | 'whatsapp'>
  priority: 'high' | 'low' | 'normal' | 'urgent'
  target: 'all' | 'users'
  title: string
  userIds: string[]
}) {
  return callEdgeFunction<{ notification_count: number; queued_count: number; target_users: number }>({
    body: {
      action_url: input.actionUrl ?? null,
      body: input.body,
      category: input.category,
      channels: input.channels,
      priority: input.priority,
      target: input.target,
      user_ids: input.userIds,
      title: input.title,
    },
    method: 'POST',
    name: 'send-notification',
  })
}

export async function processNotificationQueue() {
  return callEdgeFunction<{ failed: number; processed: number; retrying: number; sent: number }>({
    method: 'POST',
    name: 'process-notifications',
  })
}

export async function fetchAdminNotificationQueuePage(input: {
  category?: string
  channel?: NotificationQueueItem['channel'] | 'all'
  page: number
  pageSize: number
  priority?: NotificationQueueItem['priority'] | 'all'
  query?: string
  status?: NotificationQueueItem['status'] | 'all'
}): Promise<NotificationQueuePage> {
  const client = ensureSupabase()

  let query = client
    .from('notification_queue')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (input.channel && input.channel !== 'all') {
    query = query.eq('channel', input.channel)
  }

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status)
  }

  if (input.priority && input.priority !== 'all') {
    query = query.eq('priority', input.priority)
  }

  if (input.category && input.category !== 'all') {
    query = query.eq('category', input.category)
  }

  if (input.query && input.query.trim().length > 0) {
    const q = input.query.trim().replace(/[%_]/g, '')
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
  }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw error
  }

  return {
    items: (data ?? []).map((row) => mapQueueRow(row as NotificationQueueRow)),
    totalCount: count ?? 0,
  }
}

export async function fetchAdminNotificationQueueStats(): Promise<NotificationQueueStats> {
  const client = ensureSupabase()

  const [pendingResult, retryResult, sentResult, failedResult, totalResult] = await Promise.all([
    client.from('notification_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('notification_queue').select('id', { count: 'exact', head: true }).eq('status', 'retry'),
    client.from('notification_queue').select('id', { count: 'exact', head: true }).in('status', ['sent', 'delivered']),
    client.from('notification_queue').select('id', { count: 'exact', head: true }).in('status', ['failed', 'bounced']),
    client.from('notification_queue').select('id', { count: 'exact', head: true }),
  ])

  const error = pendingResult.error || retryResult.error || sentResult.error || failedResult.error || totalResult.error
  if (error) {
    throw error
  }

  const pending = pendingResult.count ?? 0
  const retrying = retryResult.count ?? 0
  const sent = sentResult.count ?? 0
  const failed = failedResult.count ?? 0
  const total = totalResult.count ?? 0
  const deliveryRate = total > 0 ? Math.round(((sent / total) * 100) * 100) / 100 : 0

  return {
    deliveryRate,
    failed,
    pending,
    retrying,
    sent,
    total,
  }
}

export async function reprocessQueueItem(queueId: string) {
  const client = ensureSupabase()
  const { error } = await client
    .from('notification_queue')
    .update({
      final_error: null,
      next_retry_at: new Date().toISOString(),
      status: 'pending',
    })
    .eq('id', queueId)

  if (error) {
    throw error
  }
}

export async function cancelQueueItem(queueId: string) {
  const client = ensureSupabase()
  const { error } = await client
    .from('notification_queue')
    .update({
      final_error: 'cancelled_by_admin',
      next_retry_at: new Date().toISOString(),
      status: 'failed',
    })
    .eq('id', queueId)

  if (error) {
    throw error
  }
}
