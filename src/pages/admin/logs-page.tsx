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
import { fetchAdminLogEvents } from '@/domains/logs/api'
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
  if (normalized.includes('error') || normalized.includes('fail')) {
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
    queryKey: ['logs', 'admin'],
    queryFn: fetchAdminLogEvents,
  })

  const logs = logsQuery.data ?? []
  const entityOptions = useMemo(
    () =>
      ['all', ...new Set(logs.map((log) => log.entityType).filter((value): value is string => Boolean(value)))],
    [logs],
  )

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return logs.filter((log) => {
      const matchesKind = kindFilter === 'all' ? true : log.kind === kindFilter
      const matchesEntity = entityFilter === 'all' ? true : log.entityType === entityFilter
      const haystack = [
        log.label,
        log.secondaryLabel,
        log.detail ?? '',
        log.actorName ?? '',
        log.actorUserId ?? '',
        log.entityId ?? '',
        log.entityType ?? '',
      ]
        .join(' ')
        .toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesKind && matchesEntity && matchesQuery
    })
  }, [entityFilter, kindFilter, logs, query])

  const paginatedLogs = useMemo(
    () => filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLogs, page],
  )

  const stats = useMemo(
    () => ({
      audits: logs.filter((log) => log.kind === 'audit').length,
      integrations: logs.filter((log) => log.kind === 'integration').length,
      total: logs.length,
      withErrors: logs.filter((log) =>
        log.kind === 'integration'
          ? log.secondaryLabel.toLowerCase().includes('error') ||
            log.secondaryLabel.toLowerCase().includes('fail')
          : false,
      ).length,
    }),
    [logs],
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
        description="Trilha administrativa e integrações com leitura operacional, filtro rápido e contexto suficiente para suporte."
        eyebrow="Admin / logs"
        title="Logs e auditoria"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Integrações" value={stats.integrations} />
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
            <option value="integration">Integrações</option>
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
                {log.kind === 'integration' ? 'Integração' : 'Auditoria'}
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
                <p className="text-xs">{log.entityId ? `ID ${log.entityId}` : 'Sem id específico'}</p>
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
        data={paginatedLogs}
        emptyDescription="Nenhum evento corresponde aos filtros atuais."
        emptyTitle="Sem logs neste recorte"
        errorMessage="Não foi possível carregar a trilha de logs."
        getRowKey={(log) => `${log.kind}-${log.id}`}
        isError={logsQuery.isError}
        isLoading={logsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredLogs.length}
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
