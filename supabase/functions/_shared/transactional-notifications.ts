import { createAdminClient } from './supabase.ts'

type NotificationPriority = 'high' | 'low' | 'normal' | 'urgent'

export async function enqueueTransactionalNotification(input: {
  actionUrl?: string | null
  body: string
  category: string
  channels?: Array<'email' | 'in-app' | 'push' | 'whatsapp'>
  payload?: Record<string, unknown>
  priority?: NotificationPriority
  title: string
  userId: string
}) {
  const admin = createAdminClient()
  const channels = input.channels ?? ['in-app', 'email']
  const priority = input.priority ?? 'normal'
  const actionUrl = input.actionUrl ?? null

  const { data: notification, error: notificationError } = await admin
    .from('notifications')
    .insert({
      action_url: actionUrl,
      body: input.body,
      category: input.category,
      is_actionable: Boolean(actionUrl),
      priority,
      title: input.title,
      user_id: input.userId,
    })
    .select('id')
    .single()

  if (notificationError || !notification) {
    throw notificationError ?? new Error('Falha ao inserir notificação transacional.')
  }

  const queueRows = channels.map((channel) => ({
    body: input.body,
    category: input.category,
    channel,
    notification_id: notification.id,
    payload: {
      ...(input.payload ?? {}),
      action_url: actionUrl,
      dispatch_origin: 'automatic',
      dispatch_type: 'transactional',
      notification_id: notification.id,
    },
    priority,
    title: input.title,
    user_id: input.userId,
  }))

  const { error: queueError } = await admin
    .from('notification_queue')
    .insert(queueRows)

  if (queueError) {
    throw queueError
  }

  return {
    notificationId: notification.id,
    queuedCount: queueRows.length,
  }
}