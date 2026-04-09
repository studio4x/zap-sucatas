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
import { fetchAdminLogEventsPage, fetchAdminLogStats } from '@/domains/logs/api'
import type { AdminLogEvent } from '@/domains/logs/types'

const PAGE_SIZE = 12

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getLogTone(log: AdminLogEvent) {
  if (log.kind === 'audit') {
    return 'info' as const
  }

  const normalized = log.secondaryLabel.toLowerCase()
  if (normalized.includes('error') || normalized.includes('fail') || normalized.includes('blocked')) {
    return 'danger' as const
  }

  if (normalized.includes('success') || normalized.includes('ok')) {
    return 'success' as const
  }

  return 'warning' as const
}

export function AdminLogsPage() {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'audit' | 'integration'>('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AdminLogEvent | null>(null)

  const logsQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['logs', 'admin', 'page', { entityFilter, kindFilter, page, query }],
    queryFn: () =>
      fetchAdminLogEventsPage({
        entityType: entityFilter,
        kind: kindFilter,
        page,
        pageSize: PAGE_SIZE,
        query,
      }),
  })

  const statsQuery = useQuery({
    queryKey: ['logs', 'admin', 'stats'],
    queryFn: fetchAdminLogStats,
  })

  const logs = logsQuery.data?.items ?? []
  const totalCount = logsQuery.data?.totalCount ?? 0
  const entityOptions = useMemo(
    () =>
      ['all', ...new Set(logs.map((log) => log.entityType).filter((value): value is string => Boolean(value)))],
    [logs],
  )
  const stats = statsQuery.data ?? {
    audits: 0,
    integrations: 0,
    total: 0,
    withErrors: 0,
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.pricing}>Precos</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
          </>
        }
        description="Trilha administrativa e integracoes com leitura operacional, filtro rapido e contexto suficiente para suporte."
        eyebrow="Admin / logs"
        title="Logs e auditoria"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Integracoes" value={stats.integrations} />
        <AdminStatCard label="Auditoria" value={stats.audits} />
        <AdminStatCard label="Falhas" value={stats.withErrors} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setEntityFilter('all')
              setKindFilter('all')
              setPage(1)
              setQuery('')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtre por tipo, entidade e termos-chave antes de abrir o detalhe de um evento."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por evento, ator, entidade, status ou detalhe"
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
            <option value="integration">Integracoes</option>
            <option value="audit">Auditoria</option>
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
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Tipo',
            cell: (log) => (
              <AdminStatusBadge tone={getLogTone(log)}>
                {log.kind === 'integration' ? 'Integracao' : 'Auditoria'}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Evento',
            cell: (log) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{log.label}</p>
                <p className="text-xs text-muted-foreground">{log.secondaryLabel}</p>
              </div>
            ),
          },
          {
            header: 'Contexto',
            cell: (log) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Ator: {log.actorName ?? log.actorUserId ?? 'Sistema'}</p>
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
            header: 'Acoes',
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
        errorMessage="Nao foi possivel carregar a trilha de logs."
        getRowKey={(log) => `${log.kind}-${log.id}`}
        isError={logsQuery.isError || statsQuery.isError}
        isLoading={logsQuery.isLoading || statsQuery.isLoading}
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
