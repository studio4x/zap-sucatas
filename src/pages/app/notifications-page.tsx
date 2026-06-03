import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardFilterCard } from '@/components/dashboard/dashboard-filter-card'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { NotificationMessageDialog } from '@/components/shared/notification-message-dialog'
import {
  fetchNotificationCenter,
  fetchNotificationPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences,
} from '@/domains/notifications/api'
import { useAuth } from '@/hooks/use-auth'
import {
  formatNotificationDateTime,
  formatRelativeNotificationDate,
  getNotificationPriorityMeta,
} from '@/lib/notifications'
import type { NotificationItem } from '@/domains/notifications/types'

export function AppNotificationsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'center', { categoryFilter, onlyUnread }],
    queryFn: () =>
      fetchNotificationCenter({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        limit: 100,
        unreadOnly: onlyUnread,
      }),
  })

  const preferencesQuery = useQuery({
    queryKey: ['notifications', 'preferences', user?.profileId],
    queryFn: () => fetchNotificationPreferences(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId, 'in-app'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'center'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
      ])
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'center'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
      ])
    },
  })

  const preferencesMutation = useMutation({
    mutationFn: (input: {
      key:
        | 'emailEnabled'
        | 'pushEnabled'
        | 'whatsappEnabled'
        | 'inAppEnabled'
        | 'quietHoursEnabled'
        | 'quietHoursStart'
        | 'quietHoursEnd'
        | 'quietHoursTimezone'
        | 'emailDigest'
      value: boolean | string
    }) => {
      if (!user?.profileId || !preferencesQuery.data) {
        throw new Error('Preferencias indisponiveis para atualização.')
      }

      const current = preferencesQuery.data

      return updateNotificationPreferences({
        emailDigest: (input.key === 'emailDigest' ? input.value : current.emailDigest) as typeof current.emailDigest,
        emailEnabled: input.key === 'emailEnabled' ? Boolean(input.value) : current.emailEnabled,
        inAppEnabled: input.key === 'inAppEnabled' ? Boolean(input.value) : current.inAppEnabled,
        profileId: user.profileId,
        pushEnabled: input.key === 'pushEnabled' ? Boolean(input.value) : current.pushEnabled,
        quietHoursEnabled: input.key === 'quietHoursEnabled' ? Boolean(input.value) : current.quietHoursEnabled,
        quietHoursEnd: input.key === 'quietHoursEnd' ? String(input.value || '') || null : current.quietHoursEnd,
        quietHoursStart: input.key === 'quietHoursStart' ? String(input.value || '') || null : current.quietHoursStart,
        quietHoursTimezone: input.key === 'quietHoursTimezone' ? String(input.value || 'America/Sao_Paulo') : current.quietHoursTimezone,
        whatsappEnabled: input.key === 'whatsappEnabled' ? Boolean(input.value) : current.whatsappEnabled,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
  })

  const notifications = useMemo(() => {
    const rows = notificationsQuery.data?.notifications ?? []
    const q = query.trim().toLowerCase()

    if (!q) {
      return rows
    }

    return rows.filter((item) => `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(q))
  }, [notificationsQuery.data?.notifications, query])

  const categoryOptions = useMemo(() => {
    const categories = new Set((notificationsQuery.data?.notifications ?? []).map((item) => item.category))
    return ['all', ...Array.from(categories)]
  }, [notificationsQuery.data?.notifications])

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const totalCount = notificationsQuery.data?.total ?? 0
  const preferences = preferencesQuery.data

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        description="Acompanhe alertas operacionais, marque leitura e ajuste os canais de comunicação da sua conta."
        title="Notificações"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard label="Não lidas" value={unreadCount} />
        <DashboardStatCard label="Total" value={totalCount} />
        <DashboardStatCard label="Filtro ativo" value={onlyUnread ? 'Somente não lidas' : 'Todas'} />
      </div>

      <DashboardFilterCard
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOnlyUnread((value) => !value)} type="button" variant={onlyUnread ? 'default' : 'outline'}>
              {onlyUnread ? 'Mostrando não lidas' : 'Somente não lidas'}
            </Button>
            <Button disabled={unreadCount === 0 || markAllMutation.isPending} onClick={() => markAllMutation.mutate()} type="button" variant="outline">
              <CheckCheck className="size-4" />
              Marcar tudo como lido
            </Button>
          </div>
        }
        description="Filtre por categoria, busque por palavra-chave e abra diretamente o contexto da notificação."
        title="Central de notificações"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, categoria ou mensagem" value={query} />
          <Select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option value="all">Todas as categorias</option>
            {categoryOptions
              .filter((value) => value !== 'all')
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </Select>
        </div>
      </DashboardFilterCard>

      {notificationsQuery.isLoading ? (
        <div className="rounded-xl bg-card px-5 py-6 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">Carregando notificações...</div>
      ) : null}

      {notificationsQuery.isError ? (
        <DashboardAlertCard
          description="Não foi possível carregar sua central de notificações neste momento."
          title="Falha na leitura"
          tone="error"
        />
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.isError ? (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl bg-card px-5 py-7 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">Nenhuma notificação encontrada para os filtros atuais.</div>
          ) : (
            notifications.map((notification) => {
              const priorityMeta = getNotificationPriorityMeta(notification.priority)

              return (
                <article
                  className="rounded-xl bg-card p-4 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]"
                  key={notification.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bell className="size-3.5" />
                        </span>
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityMeta.tone}`}>
                          {priorityMeta.label}
                        </span>
                        {!notification.readAt ? (
                          <span className="inline-flex rounded-full border border-[#b5d3f1] bg-[#e8f2fc] px-2.5 py-0.5 text-xs font-semibold text-[#17508f]">Não lida</span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Categoria: {notification.category}</span>
                        <span>{formatRelativeNotificationDate(notification.createdAt)}</span>
                        <span>{formatNotificationDateTime(notification.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div
                        aria-label={`Abrir mensagem da notificação ${notification.title}`}
                        className="cursor-pointer rounded-xl border border-transparent px-1 py-1 transition hover:border-border hover:bg-muted/30"
                        onClick={() => setSelectedNotification(notification)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedNotification(notification)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <p className="text-sm font-medium text-foreground">Ver mensagem</p>
                        <p className="text-xs text-muted-foreground">Abrir conteúdo completo em modal</p>
                      </div>
                      {notification.actionUrl ? (
                        <Button asChild type="button" variant="outline">
                          <Link to={notification.actionUrl}>
                            <ExternalLink className="size-4" />
                            Abrir
                          </Link>
                        </Button>
                      ) : null}
                      {!notification.readAt ? (
                        <Button disabled={markOneMutation.isPending} onClick={() => markOneMutation.mutate(notification.id)} type="button" variant="ghost">
                          Marcar como lida
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      ) : null}

      <section className="rounded-xl bg-card p-5 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        <h2 className="text-base font-semibold text-foreground">Preferencias de notificação</h2>
        <p className="mt-1 text-sm text-muted-foreground">Controle os canais, horário silencioso e frequência de e-mails para sua conta.</p>

        {!preferences ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando preferencias...</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-sm text-foreground"><input checked={preferences.pushEnabled} onChange={(event) => preferencesMutation.mutate({ key: 'pushEnabled', value: event.target.checked })} type="checkbox" /> Push</label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground"><input checked={preferences.emailEnabled} onChange={(event) => preferencesMutation.mutate({ key: 'emailEnabled', value: event.target.checked })} type="checkbox" /> Email</label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground"><input checked={preferences.whatsappEnabled} onChange={(event) => preferencesMutation.mutate({ key: 'whatsappEnabled', value: event.target.checked })} type="checkbox" /> WhatsApp</label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground"><input checked={preferences.inAppEnabled} onChange={(event) => preferencesMutation.mutate({ key: 'inAppEnabled', value: event.target.checked })} type="checkbox" /> In-app</label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground md:col-span-3"><input checked={preferences.quietHoursEnabled} onChange={(event) => preferencesMutation.mutate({ key: 'quietHoursEnabled', value: event.target.checked })} type="checkbox" /> Ativar horário silencioso</label>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Inicio</label>
                <Input onChange={(event) => preferencesMutation.mutate({ key: 'quietHoursStart', value: event.target.value })} type="time" value={preferences.quietHoursStart ?? ''} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Fim</label>
                <Input onChange={(event) => preferencesMutation.mutate({ key: 'quietHoursEnd', value: event.target.value })} type="time" value={preferences.quietHoursEnd ?? ''} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Fuso</label>
                <Input onBlur={(event) => preferencesMutation.mutate({ key: 'quietHoursTimezone', value: event.target.value })} defaultValue={preferences.quietHoursTimezone} />
              </div>
            </div>

            <div className="space-y-1 md:max-w-xs">
              <label className="text-sm text-muted-foreground">Frequência de email</label>
              <Select onChange={(event) => preferencesMutation.mutate({ key: 'emailDigest', value: event.target.value })} value={preferences.emailDigest}>
                <option value="immediate">Imediato</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="never">Nunca</option>
              </Select>
            </div>
          </div>
        )}
      </section>

      <NotificationMessageDialog
        badgeLabel={selectedNotification?.readAt ? 'Lida' : 'Não lida'}
        badgeTone={selectedNotification?.readAt ? 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]' : 'border-[#b5d3f1] bg-[#e8f2fc] text-[#17508f]'}
        body={selectedNotification?.body ?? ''}
        createdAt={selectedNotification?.createdAt ?? new Date().toISOString()}
        details={[
          { label: 'Categoria', value: selectedNotification?.category ?? 'Não informada' },
          { label: 'Prioridade', value: selectedNotification ? getNotificationPriorityMeta(selectedNotification.priority).label : 'Normal' },
          { label: 'Ação', value: selectedNotification?.actionUrl ?? 'Sem ação vinculada' },
          { label: 'ID', value: selectedNotification?.id ?? '—' },
        ]}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null)
          }
        }}
        open={Boolean(selectedNotification)}
        title={selectedNotification?.title ?? 'Mensagem'}
      />
    </section>
  )
}
