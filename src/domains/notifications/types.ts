export type NotificationPriority = 'high' | 'low' | 'normal' | 'urgent'
export type NotificationChannel = 'email' | 'in-app' | 'push' | 'whatsapp'
export type NotificationQueueStatus = 'bounced' | 'delivered' | 'failed' | 'pending' | 'retry' | 'sent'
export type NotificationDispatchOrigin = 'automatic' | 'manual' | 'unknown'

export type NotificationItem = {
  actionUrl: string | null
  body: string
  category: string
  createdAt: string
  id: string
  isActionable: boolean
  priority: NotificationPriority
  readAt: string | null
  readByChannels: string[]
  title: string
  userId: string
}

export type NotificationCenterResponse = {
  notifications: NotificationItem[]
  total: number
  unreadCount: number
}

export type NotificationPreferences = {
  emailDigest: 'daily' | 'immediate' | 'never' | 'weekly'
  emailEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursEnd: string | null
  quietHoursStart: string | null
  quietHoursTimezone: string
  userId: string
  whatsappEnabled: boolean
}

export type NotificationQueueItem = {
  attemptCount: number
  body: string
  category: string
  channel: NotificationChannel
  createdAt: string
  finalError: string | null
  id: string
  nextRetryAt: string | null
  notificationId: string
  payload: Record<string, unknown>
  priority: NotificationPriority
  providerMessageId: string | null
  status: NotificationQueueStatus
  title: string
  updatedAt: string
  userId: string
}

export type NotificationQueuePage = {
  items: NotificationQueueItem[]
  totalCount: number
}

export type NotificationQueueStats = {
  deliveryRate: number
  failed: number
  pending: number
  retrying: number
  sent: number
  total: number
}

export type NotificationHistoryItem = {
  body: string
  category: string
  channels: NotificationChannel[]
  createdAt: string
  id: string
  origin: NotificationDispatchOrigin
  priority: NotificationPriority
  queueItems: number
  recipientSummary: string
  status: NotificationQueueStatus | 'mixed' | 'partial' | 'widget_only'
  title: string
  updatedAt: string
}

export type NotificationHistoryPage = {
  items: NotificationHistoryItem[]
  totalCount: number
}

export type NotificationPurgeResult = {
  deletedCount: number
  mode: 'delete_all' | 'purge_old'
  retentionDays: number | null
  success: boolean
  skipped?: boolean
}
