import { Bell, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { fetchNotificationCenter, markAllNotificationsAsRead, markNotificationAsRead } from '@/domains/notifications/api'
import type { NotificationCenterResponse, NotificationItem } from '@/domains/notifications/types'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/integrations/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { formatRelativeNotificationDate, getNotificationPriorityMeta } from '@/lib/notifications'
import { cn } from '@/lib/utils'

type NotificationBellMenuProps = {
  className?: string
  notificationsPath: string
  queryKeyScope: string
  title?: string
}

type NotificationBellMenuContentProps = NotificationBellMenuProps & {
  profileId: string | null
  widgetStorageKey: string | null
}

type NotificationRealtimeEntry = {
  channel: RealtimeChannel
  listeners: Set<(payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void>
}

const notificationRealtimeRegistry = new Map<string, NotificationRealtimeEntry>()

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function formatNotificationCategoryLabel(category: string) {
  const trimmed = category.trim()

  if (!trimmed) {
    return 'Geral'
  }

  const translated: Record<string, string> = {
    account: 'Conta',
    contact: 'Contato',
    digest: 'Resumo',
    featured_payment: 'Pagamento de destaque',
    general: 'Geral',
    listing_questions: 'Perguntas do anúncio',
    listing_status: 'Status do anúncio',
    payment: 'Pagamento',
    support: 'Suporte',
    system: 'Sistema',
    technical: 'Técnico',
  }

  if (translated[trimmed]) {
    return translated[trimmed]
  }

  return trimmed
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function readWidgetClearedAt(widgetStorageKey: string | null) {
  if (!widgetStorageKey || typeof window === 'undefined') {
    return null
  }

  const storedValue = window.localStorage.getItem(widgetStorageKey)
  const parsedValue = storedValue ? Number(storedValue) : Number.NaN

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function mapRealtimeNotification(row: Record<string, unknown>): NotificationItem | null {
  const id = typeof row.id === 'string' ? row.id : null
  const title = typeof row.title === 'string' ? row.title : null
  const body = typeof row.body === 'string' ? row.body : null
  const category = typeof row.category === 'string' ? row.category : ''
  const createdAt = typeof row.created_at === 'string' ? row.created_at : null
  const priority = row.priority === 'high' || row.priority === 'low' || row.priority === 'normal' || row.priority === 'urgent'
    ? row.priority
    : 'normal'

  if (!id || !title || !body || !createdAt) {
    return null
  }

  return {
    actionUrl: typeof row.action_url === 'string' ? row.action_url : null,
    body,
    category,
    createdAt,
    id,
    isActionable: Boolean(row.is_actionable),
    priority,
    readAt: typeof row.read_at === 'string' ? row.read_at : null,
    readByChannels: Array.isArray(row.read_by_channels)
      ? row.read_by_channels.filter((value): value is string => typeof value === 'string')
      : [],
    title,
    userId: typeof row.user_id === 'string' ? row.user_id : '',
  }
}

function getRealtimeRowId(row: unknown) {
  if (!row || typeof row !== 'object') {
    return null
  }

  const value = (row as Record<string, unknown>).id
  return typeof value === 'string' ? value : null
}

function bindNotificationRealtime(
  channelKey: string,
  profileId: string,
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
) {
  const client = supabase
  if (!client) {
    return () => {}
  }

  let entry = notificationRealtimeRegistry.get(channelKey)

  if (!entry) {
    const listeners = new Set<(payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void>()
    const notify = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      for (const listener of listeners) {
        listener(payload)
      }
    }

    const channel = client
      .channel(channelKey)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profileId}` },
        notify,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profileId}` },
        notify,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profileId}` },
        notify,
      )
      .subscribe()

    entry = { channel, listeners }
    notificationRealtimeRegistry.set(channelKey, entry)
  }

  entry.listeners.add(onChange)

  return () => {
    const currentEntry = notificationRealtimeRegistry.get(channelKey)
    if (!currentEntry) {
      return
    }

    currentEntry.listeners.delete(onChange)

    if (currentEntry.listeners.size === 0) {
      notificationRealtimeRegistry.delete(channelKey)
      void client.removeChannel(currentEntry.channel)
    }
  }
}

export function NotificationBellMenu({
  className,
  notificationsPath,
  queryKeyScope,
  title = 'Notificações',
}: NotificationBellMenuProps) {
  const { user } = useAuth()
  const profileId = user?.profileId ?? null
  const widgetStorageKey = useMemo(() => {
    if (!profileId) {
      return null
    }

    return `notifications-widget-cleared-at:${queryKeyScope}:${profileId}`
  }, [queryKeyScope, profileId])

  return (
    <NotificationBellMenuContent
      key={widgetStorageKey ?? profileId ?? 'notifications-widget-guest'}
      className={className}
      notificationsPath={notificationsPath}
      profileId={profileId}
      queryKeyScope={queryKeyScope}
      title={title}
      widgetStorageKey={widgetStorageKey}
    />
  )
}

function NotificationBellMenuContent({
  className,
  notificationsPath,
  profileId,
  queryKeyScope,
  title = 'Notificações',
  widgetStorageKey,
}: NotificationBellMenuContentProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [widgetClearedAt, setWidgetClearedAt] = useState<number | null>(() => readWidgetClearedAt(widgetStorageKey))
  const rootRef = useRef<HTMLDivElement | null>(null)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'widget', queryKeyScope, profileId],
    queryFn: () => fetchNotificationCenter({ limit: 0 }),
    enabled: Boolean(profileId),
    refetchInterval: 60_000,
  })

  const notifications = useMemo(() => notificationsQuery.data?.notifications ?? [], [notificationsQuery.data?.notifications])
  const visibleNotifications = useMemo(() => {
    if (widgetClearedAt === null) {
      return notifications
    }

    return notifications.filter((notification) => new Date(notification.createdAt).getTime() > widgetClearedAt)
  }, [notifications, widgetClearedAt])
  const visibleUnreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.readAt).length,
    [visibleNotifications],
  )
  const visibleTotalCount = visibleNotifications.length
  const hasHiddenNotifications = notifications.length > visibleNotifications.length
  const categorySummary = useMemo(() => {
    const counts = new Map<string, { total: number; unread: number }>()

    for (const notification of notifications) {
      const key = notification.category.trim() || 'geral'
      const current = counts.get(key) ?? { total: 0, unread: 0 }

      current.total += 1
      if (!notification.readAt) {
        current.unread += 1
      }

      counts.set(key, current)
    }

    return Array.from(counts.entries())
      .map(([category, value]) => ({
        category,
        label: formatNotificationCategoryLabel(category),
        total: value.total,
        unread: value.unread,
      }))
      .sort((left, right) => right.unread - left.unread || right.total - left.total || left.label.localeCompare(right.label))
  }, [notifications])
  const showCategorySummary = queryKeyScope === 'admin'

  const widgetQueryKey = useMemo(() => ['notifications', 'widget', queryKeyScope, profileId] as const, [profileId, queryKeyScope])

  const invalidateNotifications = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: widgetQueryKey }),
    ])
  }, [queryClient, widgetQueryKey])

  const applyRealtimeNotification = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const row = payload.new as Record<string, unknown> | null
      const notificationId = typeof row?.id === 'string' ? row.id : getRealtimeRowId(payload.old)

      queryClient.setQueryData<NotificationCenterResponse>(widgetQueryKey, (current) => {
        const currentNotifications = current?.notifications ?? []
        const currentTotal = current?.total ?? currentNotifications.length
        const currentUnread = current?.unreadCount ?? currentNotifications.filter((notification) => !notification.readAt).length

        if (payload.eventType === 'DELETE') {
          if (!notificationId) {
            return current ?? { notifications: [], total: 0, unreadCount: 0 }
          }

          const nextNotifications = currentNotifications.filter((notification) => notification.id !== notificationId)
          const removed = currentNotifications.length - nextNotifications.length
          const removedUnread = currentNotifications.reduce(
            (count, notification) => count + (notification.id === notificationId && !notification.readAt ? 1 : 0),
            0,
          )

          return {
            notifications: nextNotifications,
            total: Math.max(0, currentTotal - removed),
            unreadCount: Math.max(0, currentUnread - removedUnread),
          }
        }

        if (!row) {
          return current ?? { notifications: [], total: 0, unreadCount: 0 }
        }

        const mapped = mapRealtimeNotification(row)
        if (!mapped || mapped.userId !== profileId) {
          return current ?? { notifications: [], total: 0, unreadCount: 0 }
        }

        const nextNotifications = [
          mapped,
          ...currentNotifications.filter((notification) => notification.id !== mapped.id),
        ].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

        const nextUnreadCount = nextNotifications.filter((notification) => !notification.readAt).length

        return {
          notifications: nextNotifications,
          total: Math.max(currentTotal, nextNotifications.length),
          unreadCount: nextUnreadCount,
        }
      })

      void invalidateNotifications()
    },
    [invalidateNotifications, profileId, queryClient, widgetQueryKey],
  )

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId, 'in-app'),
    onSuccess: invalidateNotifications,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidateNotifications,
  })

  useEffect(() => {
    if (!profileId) {
      return
    }

    const channelKey = `notifications-widget-${queryKeyScope}-${profileId}`
    const unsubscribe = bindNotificationRealtime(channelKey, profileId, applyRealtimeNotification)

    return () => {
      unsubscribe()
    }
  }, [applyRealtimeNotification, profileId, queryKeyScope])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const closePanel = () => setOpen(false)

  const clearWidget = () => {
    const clearedAt = Date.now()
    setWidgetClearedAt(clearedAt)

    if (widgetStorageKey) {
      window.localStorage.setItem(widgetStorageKey, String(clearedAt))
    }
  }

  const handleMarkAll = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: closePanel,
    })
  }

  const handleMarkOne = (notificationId: string) => {
    markOneMutation.mutate(notificationId)
  }

  return (
    <div className={cn('relative inline-flex', className)} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Abrir ${title.toLowerCase()}`}
        className="relative inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition hover:bg-secondary"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Bell className="size-4" />
        {visibleUnreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(32rem,calc(100vw-1rem))] overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
              <p className="text-sm text-foreground">
                {visibleUnreadCount > 0
                  ? `${visibleUnreadCount} novas`
                  : hasHiddenNotifications
                    ? 'Widget limpo'
                    : 'Nenhuma nova no momento'}
                {visibleTotalCount > 0 ? ` de ${visibleTotalCount}` : ''}
              </p>
              {showCategorySummary && categorySummary.length > 0 ? (
                <div className="flex max-w-[20rem] flex-wrap gap-2 pt-2">
                  {categorySummary.map((entry) => (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                      key={entry.category}
                    >
                      <span className="text-muted-foreground">{entry.label}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {entry.unread}/{entry.total}
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild className="h-9 rounded-full px-3" size="sm" type="button" variant="outline">
                <Link onClick={closePanel} to={notificationsPath}>
                  Ver tudo
                </Link>
              </Button>
              <Button
                className="h-9 w-9 rounded-full p-0"
                onClick={closePanel}
                size="icon"
                type="button"
                variant="outline"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[30rem] overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Carregando notificações...</div>
            ) : notificationsQuery.isError ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Não foi possível carregar as notificações.</div>
            ) : visibleNotifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Nenhuma notificação encontrada.</div>
            ) : (
              <ul className="divide-y divide-border/70">
                {visibleNotifications.map((notification) => {
                  const priorityMeta = getNotificationPriorityMeta(notification.priority)
                  const preview = notification.body.length > 120 ? `${notification.body.slice(0, 117)}...` : notification.body

                  return (
                    <li className="px-4 py-4" key={notification.id}>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className={cn('mt-1 inline-flex size-2.5 shrink-0 rounded-full', notification.readAt ? 'bg-border' : 'bg-primary')} />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="min-w-0 flex-1 font-semibold text-foreground">{notification.title}</p>
                              <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', priorityMeta.tone)}>
                                {priorityMeta.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeNotificationDate(notification.createdAt)}
                              {notification.category ? ` · ${notification.category.replace(/_/g, ' ')}` : ''}
                            </p>
                            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{preview}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pl-5">
                          {notification.actionUrl ? (
                            isExternalUrl(notification.actionUrl) ? (
                              <a
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
                                href={notification.actionUrl}
                                onClick={closePanel}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Abrir
                                <ExternalLink className="size-3.5" />
                              </a>
                            ) : (
                              <Link
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
                                onClick={closePanel}
                                to={notification.actionUrl}
                              >
                                Abrir
                                <ExternalLink className="size-3.5" />
                              </Link>
                            )
                          ) : null}

                          {!notification.readAt ? (
                            <button
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={markOneMutation.isPending}
                              onClick={() => handleMarkOne(notification.id)}
                              type="button"
                            >
                              <CheckCheck className="size-3.5" />
                              Marcar como lida
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="w-full px-3 py-2 text-sm"
                disabled={visibleNotifications.length === 0}
                onClick={clearWidget}
                type="button"
                variant="outline"
              >
                <Trash2 className="size-3.5" />
                Limpar todas
              </Button>
              <Button
                className="w-full px-3 py-2 text-sm"
                disabled={visibleUnreadCount === 0 || markAllMutation.isPending}
                onClick={handleMarkAll}
                type="button"
                variant="outline"
              >
                <CheckCheck className="size-3.5" />
                Marcar todas como lidas
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
