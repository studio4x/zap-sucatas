import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminLogEvents } from '@/domains/logs/api'

const PAGE_SIZE = 12

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getLogTone(kind: 'audit' | 'integration', secondaryLabel: string) {
  if (kind === 'audit') {
    return 'info' as const
  }

  const normalized = secondaryLabel.toLowerCase()
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
  const [page, setPage] = useState(1)

  const logsQuery = useQuery({
    queryKey: ['logs', 'admin'],
    queryFn: fetchAdminLogEvents,
  })

  const logs = logsQuery.data ?? []
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return logs.filter((log) => {
      const matchesKind = kindFilter === 'all' ? true : log.kind === kindFilter
      const haystack = `${log.label} ${log.secondaryLabel} ${log.detail ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesKind && matchesQuery
    })
  }, [kindFilter, logs, query])
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
              <Link to={paths.admin.pricing}>Precos</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
          </>
        }
        description="Tabelas de integração e trilha administrativa para leitura técnica, confiável e sem ruído visual."
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
              setPage(1)
              setQuery('')
              setKindFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por evento, origem, status ou detalhe"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setKindFilter(event.target.value as typeof kindFilter)
            }}
            value={kindFilter}
          >
            <option value="all">Todos os tipos</option>
            <option value="integration">Integrações</option>
            <option value="audit">Auditoria</option>
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Tipo',
            cell: (log) => (
              <AdminStatusBadge tone={getLogTone(log.kind, log.secondaryLabel)}>
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
            header: 'Detalhe',
            cell: (log) => <span className="text-sm text-muted-foreground">{log.detail ?? 'Sem detalhe adicional'}</span>,
          },
          {
            header: 'Registrado em',
            cell: (log) => <span className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</span>,
          },
        ]}
        data={paginatedLogs}
        emptyDescription="Nenhum log corresponde aos filtros atuais."
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
    </section>
  )
}
