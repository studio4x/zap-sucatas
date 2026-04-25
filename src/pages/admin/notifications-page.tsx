import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { RefreshCw, RotateCcw, Send, StopCircle } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  cancelQueueItem,
  fetchAdminNotificationHistoryPage,
  fetchAdminNotificationQueuePage,
  fetchAdminNotificationQueueStats,
  processNotificationQueue,
  reprocessQueueItem,
  sendNotificationBroadcast,
} from '@/domains/notifications/api'
import {
  notificationBroadcastSchema,
  type NotificationBroadcastValues,
} from '@/domains/notifications/schemas'
import type { NotificationHistoryItem, NotificationQueueItem } from '@/domains/notifications/types'
import {
  formatNotificationDateTime,
  getNotificationChannelMeta,
  getNotificationPriorityMeta,
  getNotificationQueueStatusMeta,
} from '@/lib/notifications'

const PAGE_SIZE = 14
const HISTORY_PAGE_SIZE = 12

type NotificationsTab = 'history' | 'operations'

function getHistoryOriginMeta(origin: NotificationHistoryItem['origin']) {
  if (origin === 'manual') {
    return {
      label: 'Manual',
      tone: 'border-primary/30 bg-primary/10 text-primary',
    }
  }

  if (origin === 'automatic') {
    return {
      label: 'Automatica',
      tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    }
  }

  return {
    label: 'Indefinida',
    tone: 'border-border bg-background text-muted-foreground',
  }
}

function getHistoryStatusMeta(status: NotificationHistoryItem['status']) {
  if (status === 'mixed') {
    return {
      label: 'Misto',
      tone: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    }
  }

  if (status === 'widget_only') {
    return {
      label: 'Somente widget',
      tone: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    }
  }

  return getNotificationQueueStatusMeta(status)
}

export function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<NotificationsTab>('operations')

  const [query, setQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | NotificationQueueItem['channel']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | NotificationQueueItem['status']>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | NotificationQueueItem['priority']>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [historyQuery, setHistoryQuery] = useState('')
  const [historyChannelFilter, setHistoryChannelFilter] = useState<'all' | NotificationQueueItem['channel']>('all')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | NotificationQueueItem['status']>('all')
  const [historyOriginFilter, setHistoryOriginFilter] = useState<'all' | NotificationHistoryItem['origin']>('all')
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)

  const queueQuery = useQuery({
    queryKey: ['notifications', 'admin', 'queue', { categoryFilter, channelFilter, page, priorityFilter, query, statusFilter }],
    queryFn: () =>
      fetchAdminNotificationQueuePage({
        category: categoryFilter,
        channel: channelFilter,
        page,
        pageSize: PAGE_SIZE,
        priority: priorityFilter,
        query,
        status: statusFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const historyListQuery = useQuery({
    queryKey: ['notifications', 'admin', 'history', { historyCategoryFilter, historyChannelFilter, historyOriginFilter, historyPage, historyQuery, historyStatusFilter }],
    queryFn: () =>
      fetchAdminNotificationHistoryPage({
        category: historyCategoryFilter,
        channel: historyChannelFilter,
        origin: historyOriginFilter,
        page: historyPage,
        pageSize: HISTORY_PAGE_SIZE,
        query: historyQuery,
        status: historyStatusFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const statsQuery = useQuery({
    queryKey: ['notifications', 'admin', 'stats'],
    queryFn: fetchAdminNotificationQueueStats,
  })

  const form = useForm<NotificationBroadcastValues>({
    resolver: zodResolver(notificationBroadcastSchema),
    defaultValues: {
      actionUrl: '',
      body: '',
      category: 'system',
      channels: ['in-app', 'email'],
      priority: 'normal',
      target: 'all',
      title: '',
      userIds: '',
    },
  })

  const broadcastMutation = useMutation({
    mutationFn: (values: NotificationBroadcastValues) =>
      sendNotificationBroadcast({
        actionUrl: values.actionUrl?.trim() || null,
        body: values.body,
        category: values.category,
        channels: values.channels,
        priority: values.priority,
        target: values.target,
        title: values.title,
        userIds: values.userIds
          ? values.userIds
            .split(',')
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
          : [],
      }),
    onSuccess: async () => {
      form.reset({
        actionUrl: '',
        body: '',
        category: 'system',
        channels: ['in-app', 'email'],
        priority: 'normal',
        target: 'all',
        title: '',
        userIds: '',
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'history'] }),
      ])
    },
  })

  const processMutation = useMutation({
    mutationFn: processNotificationQueue,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'history'] }),
      ])
    },
  })

  const retryMutation = useMutation({
    mutationFn: reprocessQueueItem,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'history'] }),
      ])
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelQueueItem,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'history'] }),
      ])
    },
  })

  const queueRows = queueQuery.data?.items ?? []
  const totalCount = queueQuery.data?.totalCount ?? 0
  const historyRows = historyListQuery.data?.items ?? []
  const historyTotalCount = historyListQuery.data?.totalCount ?? 0

  const stats = statsQuery.data ?? {
    deliveryRate: 0,
    failed: 0,
    pending: 0,
    retrying: 0,
    sent: 0,
    total: 0,
  }

  const categories = useMemo(() => {
    const values = new Set(queueRows.map((row) => row.category))
    return ['all', ...Array.from(values)]
  }, [queueRows])

  const historyCategories = useMemo(() => {
    const values = new Set(historyRows.map((row) => row.category))
    return ['all', ...Array.from(values)]
  }, [historyRows])

  const selectedChannels = form.watch('channels')
  const channelToggle = (channel: NotificationQueueItem['channel']) => {
    const values = selectedChannels.includes(channel)
      ? selectedChannels.filter((value) => value !== channel)
      : [...selectedChannels, channel]

    form.setValue('channels', values as NotificationBroadcastValues['channels'], { shouldValidate: true })
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <Button disabled={processMutation.isPending} onClick={() => processMutation.mutate()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Processar fila
          </Button>
        }
        description="Hub operacional para envio, processamento e monitoramento da fila multi-canal de notificacoes."
        eyebrow="Admin / notificacoes"
        title="Central de notificacoes"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Pendentes" value={stats.pending} />
        <AdminStatCard label="Retry" value={stats.retrying} />
        <AdminStatCard label="Enviadas" value={stats.sent} />
        <AdminStatCard label="Taxa de entrega" value={`${stats.deliveryRate.toFixed(2)}%`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <button
          className={activeTab === 'operations' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('operations')}
          type="button"
        >
          Operacao da fila
        </button>
        <button
          className={activeTab === 'history' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          Registro de envios
        </button>
      </div>

      {activeTab === 'operations' ? (
        <>
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Enviar notificacao em massa</h2>
            <p className="mt-1 text-sm text-muted-foreground">Envio administrativo para todos os usuarios ativos ou uma lista especifica de perfis.</p>

            <form
              className="mt-4 space-y-4"
              onSubmit={form.handleSubmit((values) => {
                broadcastMutation.mutate(values)
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-title">Titulo</label>
                  <Input id="notification-title" {...form.register('title')} />
                  {form.formState.errors.title ? <p className="text-sm text-destructive">{form.formState.errors.title.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-category">Categoria</label>
                  <Input id="notification-category" {...form.register('category')} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="notification-body">Mensagem</label>
                <textarea className="min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground" id="notification-body" {...form.register('body')} />
                {form.formState.errors.body ? <p className="text-sm text-destructive">{form.formState.errors.body.message}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Prioridade</label>
                  <Select {...form.register('priority')} value={form.watch('priority')}>
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Alvo</label>
                  <Select {...form.register('target')} value={form.watch('target')}>
                    <option value="all">Todos os usuarios ativos</option>
                    <option value="users">Lista de user_ids</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-action-url">Action URL (opcional)</label>
                  <Input id="notification-action-url" placeholder="/app/suporte" {...form.register('actionUrl')} />
                </div>
              </div>

              {form.watch('target') === 'users' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-users">User IDs (separados por virgula)</label>
                  <Input id="notification-users" placeholder="uuid1, uuid2" {...form.register('userIds')} />
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Canais</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(['in-app', 'push', 'email', 'whatsapp'] as const).map((channel) => (
                    <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" key={channel}>
                      <input checked={selectedChannels.includes(channel)} onChange={() => channelToggle(channel)} type="checkbox" />
                      {getNotificationChannelMeta(channel).label}
                    </label>
                  ))}
                </div>
                {form.formState.errors.channels ? <p className="text-sm text-destructive">{form.formState.errors.channels.message}</p> : null}
              </div>

              <Button disabled={broadcastMutation.isPending} type="submit">
                <Send className="size-4" />
                {broadcastMutation.isPending ? 'Enviando...' : 'Enviar notificacao'}
              </Button>
            </form>
          </section>

          <AdminFilterCard
            actions={
              <Button
                onClick={() => {
                  setQuery('')
                  setChannelFilter('all')
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setCategoryFilter('all')
                  setPage(1)
                }}
                type="button"
                variant="outline"
              >
                Limpar filtros
              </Button>
            }
            description="Monitore a fila pendente/retry, filtre por canal e execute acoes operacionais por item."
            title="Queue monitor"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_160px_160px_160px_180px]">
              <Input
                onChange={(event) => {
                  setPage(1)
                  setQuery(event.target.value)
                }}
                placeholder="Buscar por titulo ou mensagem"
                value={query}
              />
              <Select
                onChange={(event) => {
                  setPage(1)
                  setChannelFilter(event.target.value as typeof channelFilter)
                }}
                value={channelFilter}
              >
                <option value="all">Todos canais</option>
                <option value="in-app">In-app</option>
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
              <Select
                onChange={(event) => {
                  setPage(1)
                  setStatusFilter(event.target.value as typeof statusFilter)
                }}
                value={statusFilter}
              >
                <option value="all">Todos status</option>
                <option value="pending">Pending</option>
                <option value="retry">Retry</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </Select>
              <Select
                onChange={(event) => {
                  setPage(1)
                  setPriorityFilter(event.target.value as typeof priorityFilter)
                }}
                value={priorityFilter}
              >
                <option value="all">Toda prioridade</option>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
              <Select
                onChange={(event) => {
                  setPage(1)
                  setCategoryFilter(event.target.value)
                }}
                value={categoryFilter}
              >
                <option value="all">Todas categorias</option>
                {categories.filter((value) => value !== 'all').map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Select>
            </div>
          </AdminFilterCard>

          <AdminDataTable
            columns={[
              {
                header: 'Criado em',
                cell: (row) => <span className="text-xs text-muted-foreground">{formatNotificationDateTime(row.createdAt)}</span>,
              },
              {
                header: 'Canal',
                cell: (row) => <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">{getNotificationChannelMeta(row.channel).label}</span>,
              },
              {
                header: 'Conteudo',
                cell: (row) => (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground line-clamp-1">{row.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{row.body}</p>
                    <p className="text-xs text-muted-foreground">Categoria: {row.category}</p>
                  </div>
                ),
              },
              {
                header: 'Prioridade',
                cell: (row) => {
                  const meta = getNotificationPriorityMeta(row.priority)
                  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                },
              },
              {
                header: 'Status',
                cell: (row) => {
                  const meta = getNotificationQueueStatusMeta(row.status)
                  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                },
              },
              {
                header: 'Tentativas',
                cell: (row) => (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{row.attemptCount}</p>
                    <p>{row.nextRetryAt ? `Proxima: ${formatNotificationDateTime(row.nextRetryAt)}` : 'Sem retry'}</p>
                  </div>
                ),
              },
              {
                header: 'Acoes',
                className: 'text-right w-[180px]',
                cell: (row) => (
                  <AdminRowActions
                    actions={[
                      {
                        icon: RotateCcw,
                        label: 'Reprocessar',
                        onClick: () => retryMutation.mutate(row.id),
                        variant: 'outline',
                      },
                      {
                        icon: StopCircle,
                        label: 'Cancelar',
                        onClick: () => cancelMutation.mutate(row.id),
                        variant: 'ghost',
                      },
                    ]}
                  />
                ),
              },
            ]}
            data={queueRows}
            emptyDescription="Nenhum item de fila encontrado para os filtros atuais."
            emptyTitle="Fila vazia"
            errorMessage="Nao foi possivel carregar a fila de notificacoes."
            getRowKey={(row) => row.id}
            isError={queueQuery.isError || statsQuery.isError}
            isLoading={queueQuery.isLoading || statsQuery.isLoading}
          />

          <AdminPagination currentPage={page} onPageChange={setPage} pageSize={PAGE_SIZE} totalItems={totalCount} />
        </>
      ) : (
        <>
          <AdminFilterCard
            actions={
              <Button
                onClick={() => {
                  setHistoryQuery('')
                  setHistoryChannelFilter('all')
                  setHistoryStatusFilter('all')
                  setHistoryOriginFilter('all')
                  setHistoryCategoryFilter('all')
                  setHistoryPage(1)
                }}
                type="button"
                variant="outline"
              >
                Limpar filtros
              </Button>
            }
            description="Registro consolidado de disparos manuais e automaticos, cobrindo canais de email e widget de notificacoes."
            title="Historico de envios"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_170px_170px_170px_180px]">
              <Input
                onChange={(event) => {
                  setHistoryPage(1)
                  setHistoryQuery(event.target.value)
                }}
                placeholder="Buscar por titulo, mensagem ou categoria"
                value={historyQuery}
              />
              <Select
                onChange={(event) => {
                  setHistoryPage(1)
                  setHistoryChannelFilter(event.target.value as typeof historyChannelFilter)
                }}
                value={historyChannelFilter}
              >
                <option value="all">Todos canais</option>
                <option value="in-app">Widget (in-app)</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
              <Select
                onChange={(event) => {
                  setHistoryPage(1)
                  setHistoryStatusFilter(event.target.value as typeof historyStatusFilter)
                }}
                value={historyStatusFilter}
              >
                <option value="all">Todos status</option>
                <option value="pending">Pending</option>
                <option value="retry">Retry</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </Select>
              <Select
                onChange={(event) => {
                  setHistoryPage(1)
                  setHistoryOriginFilter(event.target.value as typeof historyOriginFilter)
                }}
                value={historyOriginFilter}
              >
                <option value="all">Todas origens</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatica</option>
                <option value="unknown">Indefinida</option>
              </Select>
              <Select
                onChange={(event) => {
                  setHistoryPage(1)
                  setHistoryCategoryFilter(event.target.value)
                }}
                value={historyCategoryFilter}
              >
                <option value="all">Todas categorias</option>
                {historyCategories.filter((value) => value !== 'all').map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Select>
            </div>
          </AdminFilterCard>

          <AdminDataTable
            columns={[
              {
                header: 'Criado em',
                cell: (row) => <span className="text-xs text-muted-foreground">{formatNotificationDateTime(row.createdAt)}</span>,
              },
              {
                header: 'Origem',
                cell: (row) => {
                  const meta = getHistoryOriginMeta(row.origin)
                  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                },
              },
              {
                header: 'Canais',
                cell: (row) => (
                  <div className="flex flex-wrap gap-1.5">
                    {row.channels.map((channel) => (
                      <span className="inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold" key={channel}>
                        {getNotificationChannelMeta(channel).label}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: 'Conteudo',
                cell: (row) => (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground line-clamp-1">{row.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{row.body}</p>
                    <p className="text-xs text-muted-foreground">Categoria: {row.category}</p>
                  </div>
                ),
              },
              {
                header: 'Prioridade',
                cell: (row) => {
                  const meta = getNotificationPriorityMeta(row.priority)
                  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                },
              },
              {
                header: 'Status consolidado',
                cell: (row) => {
                  const meta = getHistoryStatusMeta(row.status)
                  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                },
              },
              {
                header: 'Itens fila',
                className: 'text-right',
                cell: (row) => <span className="text-sm font-semibold text-foreground">{row.queueItems}</span>,
              },
            ]}
            data={historyRows}
            emptyDescription="Nenhum envio encontrado para os filtros atuais."
            emptyTitle="Registro vazio"
            errorMessage="Nao foi possivel carregar o historico de notificacoes."
            getRowKey={(row) => row.id}
            isError={historyListQuery.isError || statsQuery.isError}
            isLoading={historyListQuery.isLoading || statsQuery.isLoading}
          />

          <AdminPagination currentPage={historyPage} onPageChange={setHistoryPage} pageSize={HISTORY_PAGE_SIZE} totalItems={historyTotalCount} />
        </>
      )}
    </section>
  )
}
