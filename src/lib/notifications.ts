import type { NotificationChannel, NotificationPriority, NotificationQueueStatus } from '@/domains/notifications/types'

export function formatNotificationDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeNotificationDate(value: string) {
  const target = new Date(value).getTime()
  const now = Date.now()
  const diffMs = target - now
  const diffMinutes = Math.round(diffMs / 60000)

  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}

export function getNotificationPriorityMeta(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgente', tone: 'border-[#f0c4bd] bg-[#fff1ee] text-[#a53c2f]' }
    case 'high':
      return { label: 'Alta', tone: 'border-[#ead4a4] bg-[#fff7e8] text-[#8f6512]' }
    case 'low':
      return { label: 'Baixa', tone: 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]' }
    default:
      return { label: 'Normal', tone: 'border-border bg-background text-foreground' }
  }
}

export function getNotificationQueueStatusMeta(status: NotificationQueueStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', tone: 'border-border bg-background text-foreground' }
    case 'retry':
      return { label: 'Tentar novamente', tone: 'border-[#ead4a4] bg-[#fff7e8] text-[#8f6512]' }
    case 'sent':
      return { label: 'Enviado', tone: 'border-[#b5d3f1] bg-[#e8f2fc] text-[#17508f]' }
    case 'delivered':
      return { label: 'Entregue', tone: 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]' }
    case 'bounced':
      return { label: 'Devolvido', tone: 'border-[#e7c1b9] bg-[#fff5f2] text-[#8f3326]' }
    default:
      return { label: 'Falhou', tone: 'border-[#f0c4bd] bg-[#fff1ee] text-[#a53c2f]' }
  }
}

export function getNotificationChannelMeta(channel: NotificationChannel) {
  switch (channel) {
    case 'in-app':
      return { label: 'No app' }
    case 'push':
      return { label: 'Push' }
    case 'email':
      return { label: 'E-mail' }
    default:
      return { label: 'WhatsApp' }
  }
}

