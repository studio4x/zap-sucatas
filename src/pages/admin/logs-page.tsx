import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminLogDetailsDialog } from '@/components/admin/admin-log-details-dialog'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  fetchAdminLogEventsPage,
  fetchAdminLogStats,
  fetchAdminOperationalHealth,
} from '@/domains/logs/api'
import type { AdminLogEvent } from '@/domains/logs/types'

const PAGE_SIZE = 12

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatLatestEvent(log: {
  created_at: string
  integration_name: string
  status: string
} | null) {
  if (!log) {
    return 'Sem registro recente.'
  }

  return `${log.integration_name} · ${log.status} · ${formatDateTime(log.created_at)}`
}

function getLogTone(log: AdminLogEvent) {
  return log.severity
}

export function AdminLogsPage() {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'audit' | 'integration'>('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | AdminLogEvent['severity']>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AdminLogEvent | null>(null)

  const logsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['logs', 'admin', 'page', { entityFilter, kindFilter, page, query, severityFilter, sourceFilter }],
    queryFn: () =>
      fetchAdminLogEventsPage({
        entityType: entityFilter,
        kind: kindFilter,
        page,
        pageSize: PAGE_SIZE,
        query,
        severity: severityFilter,
        source: sourceFilter,
      }),
  })

  const statsQuery = useQuery({
    queryKey: ['logs', 'admin', 'stats'],
    queryFn: fetchAdminLogStats,
  })

  const healthQuery = useQuery({
    queryKey: ['logs', 'admin', 'health'],
    queryFn: fetchAdminOperationalHealth,
  })

  const logs = useMemo(() => logsQuery.data?.items ?? [], [logsQuery.data])
  const totalCount = logsQuery.data?.totalCount ?? 0
  const entityOptions = useMemo(
    () =>
      ['all', ...new Set(logs.map((log) => log.entityType).filter((value): value is string => Boolean(value)))],
    [logs],
  )
  const sourceOptions = useMemo(
    () =>
      ['all', ...new Set(logs.map((log) => log.sourceName).filter((value): value is string => Boolean(value)))],
    [logs],
  )
  const stats = useMemo(
    () =>
      statsQuery.data ?? {
        audits: 0,
        integrations: 0,
        total: 0,
        withErrors: 0,
      },
    [statsQuery.data],
  )
  const health = useMemo(
    () =>
      healthQuery.data ?? {
        auditEvents24h: 0,
        contactMessages24h: 0,
        errors24h: 0,
        latestIntegrationEvent: null,
        latestPricingSync: null,
      },
    [healthQuery.data],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.pricing}>Preços</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.listings}>Anúncios</Link>
            </Button>
          </>
        }
        description="Trilha administrativa com severidade, origem do evento e sinais operacionais para leitura rápida."
        eyebrow="Administração / logs"
        title="Logs e auditoria"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Integrações" value={stats.integrations} />
        <AdminStatCard label="Auditoria" value={stats.audits} />
        <AdminStatCard label="Falhas" value={stats.withErrors} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          description="Eventos bloqueados ou com erro nas ultimas 24h."
          label="Falhas 24h"
          value={health.errors24h}
        />
        <AdminStatCard
          description="Entradas recebidas pelo contato público nas ultimas 24h."
          label="Contato 24h"
          value={health.contactMessages24h}
        />
        <AdminStatCard
          description="Ações administrativas registradas nas ultimas 24h."
          label="Auditoria 24h"
          value={health.auditEvents24h}
        />
        <AdminStatCard
          description={formatLatestEvent(health.latestPricingSync)}
          label="Último sync LME"
          value={health.latestPricingSync?.status ?? 'Sem sync'}
        />
        <AdminStatCard
          description={formatLatestEvent(health.latestIntegrationEvent)}
          label="Última integração"
          value={health.latestIntegrationEvent?.integration_name ?? 'Sem evento'}
        />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setEntityFilter('all')
              setKindFilter('all')
              setPage(1)
              setQuery('')
              setSeverityFilter('all')
              setSourceFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtre por tipo, severidade, origem e entidade antes de abrir o detalhe de um evento."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_200px_200px_200px_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por evento, origem, ação, entidade ou detalhe"
            value={query}
          />
          <Select
            onChange={(event) => {
              setKindFilter(event.target.value as typeof kindFilter)
              setPage(1)
            }}
            value={kindFilter}
          >
            <option value="all">Todos os tipos</option>
            <option value="integration">Integrações</option>
            <option value="audit">Auditoria</option>
          </Select>
          <Select
            onChange={(event) => {
              setSeverityFilter(event.target.value as typeof severityFilter)
              setPage(1)
            }}
            value={severityFilter}
          >
            <option value="all">Toda severidade</option>
            <option value="info">Info</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="danger">Crítico</option>
          </Select>
          <Select
            onChange={(event) => {
              setEntityFilter(event.target.value)
              setPage(1)
            }}
            value={entityFilter}
          >
            <option value="all">Todas as entidades</option>
            {entityOptions
              .filter((entity) => entity !== 'all')
              .map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
          </Select>
          <Select
            onChange={(event) => {
              setSourceFilter(event.target.value)
              setPage(1)
            }}
            value={sourceFilter}
          >
            <option value="all">Toda origem</option>
            {sourceOptions
              .filter((source) => source !== 'all')
              .map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Severidade',
            cell: (log) => <AdminStatusBadge tone={getLogTone(log)}>{log.severity}</AdminStatusBadge>,
          },
          {
            header: 'Evento',
            cell: (log) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{log.label}</p>
                <p className="text-xs text-muted-foreground">
                  {log.actionKey ?? log.secondaryLabel ?? 'Sem classificação complementar'}
                </p>
              </div>
            ),
          },
          {
            header: 'Origem',
            cell: (log) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{log.sourceName ?? 'sem origem declarada'}</p>
                <p>Tipo: {log.kind === 'integration' ? 'Integração' : 'Auditoria'}</p>
                <p>Ator: {log.actorName ?? log.actorUserId ?? 'Sistema'}</p>
              </div>
            ),
          },
          {
            header: 'Contexto',
            cell: (log) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Entidade: {log.entityType ?? 'N/A'}</p>
                <p>{log.detail ?? 'Sem detalhe adicional'}</p>
              </div>
            ),
          },
          {
            header: 'Registrado em',
            cell: (log) => (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{formatDateTime(log.createdAt)}</p>
                <p className="text-xs">{log.entityId ? `ID ${log.entityId}` : 'Sem id especifico'}</p>
              </div>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[130px] text-right',
            cell: (log) => (
              <AdminRowActions
                actions={[
                  {
                    icon: Eye,
                    label: 'Detalhar',
                    onClick: () => setSelectedLog(log),
                    variant: 'outline',
                  },
                ]}
              />
            ),
          },
        ]}
        data={logs}
        emptyDescription="Nenhum evento corresponde aos filtros atuais."
        emptyTitle="Sem logs neste recorte"
        errorMessage="Não foi possível carregar a trilha de logs."
        getRowKey={(log) => `${log.kind}-${log.id}`}
        isError={logsQuery.isError || statsQuery.isError || healthQuery.isError}
        isLoading={logsQuery.isLoading || statsQuery.isLoading || healthQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <AdminLogDetailsDialog
        log={selectedLog}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null)
          }
        }}
        open={Boolean(selectedLog)}
      />
    </section>
  )
}
