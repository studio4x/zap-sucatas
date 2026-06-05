import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { fetchNotificationCenter, markAllNotificationsAsRead, markNotificationAsRead } from '@/domains/notifications/api'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/integrations/supabase/client'
import { formatRelativeNotificationDate, getNotificationPriorityMeta } from '@/lib/notifications'
import { cn } from '@/lib/utils'

type NotificationBellMenuProps = {
  className?: string
  notificationsPath: string
  queryKeyScope: string
  title?: string
}

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function NotificationBellMenu({
  className,
  notificationsPath,
  queryKeyScope,
  title = 'Notificações',
}: NotificationBellMenuProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'widget', queryKeyScope, user?.profileId],
    queryFn: () => fetchNotificationCenter({ limit: 8 }),
    enabled: Boolean(user?.profileId),
    refetchInterval: 60_000,
  })

  const notifications = useMemo(() => notificationsQuery.data?.notifications ?? [], [notificationsQuery.data?.notifications])
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const totalCount = notificationsQuery.data?.total ?? 0

  const invalidateNotifications = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'widget', queryKeyScope, user?.profileId] }),
    ])
  }, [queryClient, queryKeyScope, user?.profileId])

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId, 'in-app'),
    onSuccess: invalidateNotifications,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidateNotifications,
  })

  useEffect(() => {
    const client = supabase
    if (!client || !user?.profileId) {
      return
    }

    const channel = client
      .channel(`notifications-widget-${queryKeyScope}-${user.profileId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.profileId}` }, () => {
        void invalidateNotifications()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.profileId}` }, () => {
        void invalidateNotifications()
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.profileId}` }, () => {
        void invalidateNotifications()
      })
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [invalidateNotifications, queryKeyScope, user?.profileId])

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
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
              <p className="text-sm text-foreground">
                {unreadCount > 0 ? `${unreadCount} novas` : 'Nenhuma nova no momento'}
                {totalCount > 0 ? ` de ${totalCount}` : ''}
              </p>
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
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Nenhuma notificação encontrada.</div>
            ) : (
              <ul className="divide-y divide-border/70">
                {notifications.map((notification) => {
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
            <Button
              className="w-full"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              onClick={handleMarkAll}
              type="button"
              variant="outline"
            >
              <CheckCheck className="size-4" />
              Marcar todas como lidas
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
