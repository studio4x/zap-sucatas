import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { RefreshCw, Send } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  fetchAdminNotificationHistoryPage,
  fetchAdminNotificationQueueStats,
  processNotificationQueue,
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

const HISTORY_PAGE_SIZE = 12

type NotificationsTab = 'manual' | 'transactional'

function getHistoryOriginMeta(origin: NotificationHistoryItem['origin']) {
  if (origin === 'manual') {
    return { label: 'Manual', tone: 'border-primary/30 bg-primary/10 text-primary' }
  }
  if (origin === 'automatic') {
    return { label: 'Automática', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
  }
  return { label: 'Indefinida', tone: 'border-border bg-background text-muted-foreground' }
}

function getHistoryStatusMeta(status: NotificationHistoryItem['status']) {
  if (status === 'partial') {
    return { label: 'Parcial', tone: 'border-[#ead4a4] bg-[#fff7e8] text-[#8f6512]' }
  }
  if (status === 'mixed') {
    return { label: 'Misto', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' }
  }
  if (status === 'widget_only') {
    return { label: 'Somente widget', tone: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' }
  }
  return getNotificationQueueStatusMeta(status)
}

export function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<NotificationsTab>('manual')

  const [historyQuery, setHistoryQuery] = useState('')
  const [historyChannelFilter, setHistoryChannelFilter] = useState<'all' | NotificationQueueItem['channel']>('all')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | NotificationQueueItem['status']>('all')
  const [historyOriginFilter, setHistoryOriginFilter] = useState<'all' | NotificationHistoryItem['origin']>('automatic')
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)

  const effectiveHistoryOriginFilter: 'all' | NotificationHistoryItem['origin'] = activeTab === 'manual' ? 'manual' : historyOriginFilter

  const historyListQuery = useQuery({
    queryKey: ['notifications', 'admin', 'history', { activeTab, effectiveHistoryOriginFilter, historyCategoryFilter, historyChannelFilter, historyPage, historyQuery, historyStatusFilter }],
    queryFn: () =>
      fetchAdminNotificationHistoryPage({
        category: historyCategoryFilter,
        channel: historyChannelFilter,
        origin: effectiveHistoryOriginFilter,
        page: historyPage,
        pageSize: HISTORY_PAGE_SIZE,
        query: historyQuery,
        status: historyStatusFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const statsQuery = useQuery({ queryKey: ['notifications', 'admin', 'stats'], queryFn: fetchAdminNotificationQueueStats })

  const form = useForm<NotificationBroadcastValues>({
    resolver: zodResolver(notificationBroadcastSchema),
    defaultValues: { actionUrl: '', body: '', category: 'system', channels: ['in-app', 'email'], priority: 'normal', target: 'all', title: '', userIds: '' },
  })

  const invalidateAll = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'admin', 'history'] }),
    ])

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
        userIds: values.userIds ? values.userIds.split(',').map((part) => part.trim()).filter((part) => part.length > 0) : [],
      }),
    onSuccess: async () => {
      form.reset({ actionUrl: '', body: '', category: 'system', channels: ['in-app', 'email'], priority: 'normal', target: 'all', title: '', userIds: '' })
      await invalidateAll()
    },
  })
  const processMutation = useMutation({ mutationFn: processNotificationQueue, onSuccess: invalidateAll })

  const historyRows = historyListQuery.data?.items ?? []
  const historyTotalCount = historyListQuery.data?.totalCount ?? 0
  const stats = statsQuery.data ?? { deliveryRate: 0, failed: 0, pending: 0, retrying: 0, sent: 0, total: 0 }
  const historyCategories = useMemo(() => ['all', ...Array.from(new Set(historyRows.map((row) => row.category)))], [historyRows])
  const selectedChannels = form.watch('channels')

  const channelToggle = (channel: NotificationQueueItem['channel']) => {
    const values = selectedChannels.includes(channel) ? selectedChannels.filter((value) => value !== channel) : [...selectedChannels, channel]
    form.setValue('channels', values as NotificationBroadcastValues['channels'], { shouldValidate: true })
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={activeTab === 'transactional' ? (
          <Button disabled={processMutation.isPending} onClick={() => processMutation.mutate()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Processar fila
          </Button>
        ) : undefined}
        description="Gestão de disparos manuais e acompanhamento operacional das notificações transacionais."
        eyebrow="Administração / notificações"
        title="Central de notificações"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <button className={activeTab === 'manual' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'} onClick={() => setActiveTab('manual')} type="button">Notificações manuais</button>
        <button className={activeTab === 'transactional' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'} onClick={() => setActiveTab('transactional')} type="button">Notificações transacionais</button>
      </div>

      {activeTab === 'manual' ? (
        <>
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Enviar notificação em massa</h2>
            <p className="mt-1 text-sm text-muted-foreground">Envio administrativo para todos os usuários ativos ou uma lista específica de perfis.</p>
            <form className="mt-4 space-y-4" onSubmit={form.handleSubmit((values) => broadcastMutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-title">Título</label>
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
                    <option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Alvo</label>
                  <Select {...form.register('target')} value={form.watch('target')}>
                    <option value="all">Todos os usuários ativos</option><option value="users">Lista de user_ids</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-action-url">URL de ação (opcional)</label>
                  <Input id="notification-action-url" placeholder="/app/suporte" {...form.register('actionUrl')} />
                </div>
              </div>
              {form.watch('target') === 'users' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notification-users">IDs dos usuários (separados por vírgula)</label>
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
              <Button disabled={broadcastMutation.isPending} type="submit"><Send className="size-4" />{broadcastMutation.isPending ? 'Enviando...' : 'Enviar notificação'}</Button>
            </form>
          </section>

          <AdminFilterCard
            actions={<Button onClick={() => { setHistoryQuery(''); setHistoryChannelFilter('all'); setHistoryStatusFilter('all'); setHistoryCategoryFilter('all'); setHistoryPage(1) }} type="button" variant="outline">Limpar filtros</Button>}
            description="Histórico dos disparos criados manualmente no painel admin."
            title="Notificações manuais enviadas"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_170px_170px_180px]">
              <Input onChange={(event) => { setHistoryPage(1); setHistoryQuery(event.target.value) }} placeholder="Buscar por título, mensagem ou categoria" value={historyQuery} />
              <Select onChange={(event) => { setHistoryPage(1); setHistoryChannelFilter(event.target.value as typeof historyChannelFilter) }} value={historyChannelFilter}>
                <option value="all">Todos os canais</option><option value="in-app">No app</option><option value="email">E-mail</option><option value="push">Push</option><option value="whatsapp">WhatsApp</option>
              </Select>
              <Select onChange={(event) => { setHistoryPage(1); setHistoryStatusFilter(event.target.value as typeof historyStatusFilter) }} value={historyStatusFilter}>
                <option value="all">Todos os status</option><option value="pending">Pendente</option><option value="retry">Tentar novamente</option><option value="sent">Enviado</option><option value="delivered">Entregue</option><option value="failed">Falhou</option><option value="bounced">Devolvido</option>
              </Select>
              <Select onChange={(event) => { setHistoryPage(1); setHistoryCategoryFilter(event.target.value) }} value={historyCategoryFilter}>
                <option value="all">Todas categorias</option>{historyCategories.filter((value) => value !== 'all').map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </div>
          </AdminFilterCard>

          <AdminDataTable
            columns={[
              { header: 'Criado em', cell: (row) => <span className="text-xs text-muted-foreground">{formatNotificationDateTime(row.createdAt)}</span> },
              { header: 'Origem', cell: (row) => { const meta = getHistoryOriginMeta(row.origin); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Canais', cell: (row) => <div className="flex flex-wrap gap-1.5">{row.channels.map((channel) => <span className="inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold" key={channel}>{getNotificationChannelMeta(channel).label}</span>)}</div> },
              { header: 'Conteúdo', cell: (row) => <div className="space-y-1"><p className="font-medium text-foreground line-clamp-1">{row.title}</p><p className="text-xs text-muted-foreground line-clamp-2">{row.body}</p><p className="text-xs text-muted-foreground">Categoria: {row.category}</p><p className="text-xs font-medium text-foreground">Destinatário(s): <span className="font-normal text-muted-foreground">{row.recipientSummary}</span></p></div> },
              { header: 'Prioridade', cell: (row) => { const meta = getNotificationPriorityMeta(row.priority); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Status consolidado', cell: (row) => { const meta = getHistoryStatusMeta(row.status); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Itens fila', className: 'text-right', cell: (row) => <span className="text-sm font-semibold text-foreground">{row.queueItems}</span> },
            ]}
            data={historyRows}
            emptyDescription="Nenhum envio encontrado para os filtros atuais."
            emptyTitle="Registro vazio"
            errorMessage="Não foi possível carregar o histórico de notificações."
            getRowKey={(row) => row.id}
            isError={historyListQuery.isError || statsQuery.isError}
            isLoading={historyListQuery.isLoading || statsQuery.isLoading}
          />
          <AdminPagination currentPage={historyPage} onPageChange={setHistoryPage} pageSize={HISTORY_PAGE_SIZE} totalItems={historyTotalCount} />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Total" value={stats.total} />
            <AdminStatCard label="Pendentes" value={stats.pending} />
            <AdminStatCard label="Tentar novamente" value={stats.retrying} />
            <AdminStatCard label="Enviadas" value={stats.sent} />
            <AdminStatCard label="Taxa de entrega" value={`${stats.deliveryRate.toFixed(2)}%`} />
          </div>

          <AdminFilterCard
            actions={<Button onClick={() => { setHistoryQuery(''); setHistoryChannelFilter('all'); setHistoryStatusFilter('all'); setHistoryOriginFilter('automatic'); setHistoryCategoryFilter('all'); setHistoryPage(1) }} type="button" variant="outline">Limpar filtros</Button>}
            description="Registro consolidado das notificações automáticas/transacionais da plataforma."
            title="Histórico transacional"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_170px_170px_170px_180px]">
              <Input onChange={(event) => { setHistoryPage(1); setHistoryQuery(event.target.value) }} placeholder="Buscar por título, mensagem ou categoria" value={historyQuery} />
              <Select onChange={(event) => { setHistoryPage(1); setHistoryChannelFilter(event.target.value as typeof historyChannelFilter) }} value={historyChannelFilter}><option value="all">Todos os canais</option><option value="in-app">No app</option><option value="email">E-mail</option><option value="push">Push</option><option value="whatsapp">WhatsApp</option></Select>
              <Select onChange={(event) => { setHistoryPage(1); setHistoryStatusFilter(event.target.value as typeof historyStatusFilter) }} value={historyStatusFilter}><option value="all">Todos os status</option><option value="pending">Pendente</option><option value="retry">Tentar novamente</option><option value="sent">Enviado</option><option value="delivered">Entregue</option><option value="failed">Falhou</option><option value="bounced">Devolvido</option></Select>
              <Select onChange={(event) => { setHistoryPage(1); setHistoryOriginFilter(event.target.value as typeof historyOriginFilter) }} value={historyOriginFilter}><option value="all">Todas origens</option><option value="automatic">Automática</option><option value="unknown">Indefinida</option></Select>
              <Select onChange={(event) => { setHistoryPage(1); setHistoryCategoryFilter(event.target.value) }} value={historyCategoryFilter}><option value="all">Todas categorias</option>{historyCategories.filter((value) => value !== 'all').map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </div>
          </AdminFilterCard>

          <AdminDataTable
            columns={[
              { header: 'Criado em', cell: (row) => <span className="text-xs text-muted-foreground">{formatNotificationDateTime(row.createdAt)}</span> },
              { header: 'Origem', cell: (row) => { const meta = getHistoryOriginMeta(row.origin); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Canais', cell: (row) => <div className="flex flex-wrap gap-1.5">{row.channels.map((channel) => <span className="inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold" key={channel}>{getNotificationChannelMeta(channel).label}</span>)}</div> },
              { header: 'Conteúdo', cell: (row) => <div className="space-y-1"><p className="font-medium text-foreground line-clamp-1">{row.title}</p><p className="text-xs text-muted-foreground line-clamp-2">{row.body}</p><p className="text-xs text-muted-foreground">Categoria: {row.category}</p><p className="text-xs font-medium text-foreground">Destinatário(s): <span className="font-normal text-muted-foreground">{row.recipientSummary}</span></p></div> },
              { header: 'Prioridade', cell: (row) => { const meta = getNotificationPriorityMeta(row.priority); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Status consolidado', cell: (row) => { const meta = getHistoryStatusMeta(row.status); return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span> } },
              { header: 'Itens fila', className: 'text-right', cell: (row) => <span className="text-sm font-semibold text-foreground">{row.queueItems}</span> },
            ]}
            data={historyRows}
            emptyDescription="Nenhum envio encontrado para os filtros atuais."
            emptyTitle="Registro vazio"
            errorMessage="Não foi possível carregar o histórico de notificações."
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

