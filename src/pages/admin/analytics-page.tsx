import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, MousePointerClick, RefreshCw, Users } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminAnalyticsOverview } from '@/domains/analytics/api'
import type { AnalyticsPeriodPreset } from '@/domains/analytics/types'
import { formatNotificationDateTime } from '@/lib/notifications'

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10)
}

function getPresetRange(preset: Exclude<AnalyticsPeriodPreset, 'custom'>) {
  const end = new Date()
  const start = new Date(end)

  if (preset === '7d') {
    start.setDate(end.getDate() - 6)
  } else if (preset === '30d') {
    start.setDate(end.getDate() - 29)
  } else {
    start.setDate(end.getDate() - 89)
  }

  return {
    end: toDateInputValue(end),
    start: toDateInputValue(start),
  }
}

function buildDateRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000Z`)
  const endDate = new Date(`${end}T23:59:59.999Z`)

  return {
    endAt: endDate.toISOString(),
    startAt: startDate.toISOString(),
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = seconds / 60
  return `${minutes.toFixed(1)} min`
}

export function AdminAnalyticsPage() {
  const defaultRange = getPresetRange('30d')
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>('30d')
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)

  const effectiveRange = useMemo(() => buildDateRange(startDate, endDate), [endDate, startDate])

  const analyticsQuery = useQuery({
    queryKey: ['analytics', 'admin', effectiveRange],
    queryFn: () => fetchAdminAnalyticsOverview(effectiveRange),
  })

  const data = analyticsQuery.data

  const topPages = data?.topPages ?? []
  const topClicks = data?.topClickTargets ?? []
  const locality = data?.localityMix ?? []
  const deviceMix = data?.deviceMix ?? []
  const viewsByDay = data?.viewsByDay ?? []

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <Button onClick={() => analyticsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Atualizar
          </Button>
        }
        description="Painel completo de desempenho com acessos, cliques, conversão, recorrência e leitura de localidade operacional."
        eyebrow="Administração / estatísticas"
        title="Estatísticas da plataforma"
      />

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              const range = getPresetRange('30d')
              setPreset('30d')
              setStartDate(range.start)
              setEndDate(range.end)
            }}
            type="button"
            variant="outline"
          >
            Resetar período
          </Button>
        }
        description="Defina o recorte temporal para leitura consolidada de comportamento e crescimento da plataforma."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            onChange={(event) => {
              const value = event.target.value as AnalyticsPeriodPreset
              setPreset(value)

              if (value !== 'custom') {
                const range = getPresetRange(value)
                setStartDate(range.start)
                setEndDate(range.end)
              }
            }}
            value={preset}
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="custom">Período customizado</option>
          </Select>
          <Input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          <Input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
        </div>
      </AdminFilterCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          description="Total de page views no recorte selecionado."
          label="Acessos"
          value={data?.accessCount ?? 0}
        />
        <AdminStatCard
          description="Total de cliques em elementos de ação rastreados."
          label="Cliques"
          value={data?.clickCount ?? 0}
        />
        <AdminStatCard
          description="Taxa de cliques sobre acessos totais do período."
          label="CTR"
          value={`${(data?.ctr ?? 0).toFixed(2)}%`}
        />
        <AdminStatCard
          description="Tempo médio de permanência por página no recorte."
          label="Tempo médio"
          value={formatDuration(data?.avgNavigationSeconds ?? 0)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          description="Sessões únicas observadas no período."
          helper="Métricas de acesso anônimo e autenticado"
          label="Sessões únicas"
          value={data?.uniqueSessions ?? 0}
        />
        <AdminStatCard
          description="Usuários cadastrados dentro do recorte."
          helper="Base de crescimento recente"
          label="Usuários novos"
          value={data?.newUsers ?? 0}
        />
        <AdminStatCard
          description="Usuários com duas ou mais visualizações no período."
          helper="Indicador de retorno"
          label="Usuários recorrentes"
          value={data?.recurringUsers ?? 0}
        />
        <AdminStatCard
          description="Eventos de visualização realizados por usuários autenticados."
          helper="Comparativo entre tráfego logado e geral"
          label="Eventos logados"
          value={data?.loggedUserEvents ?? 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Acessos por dia</h2>
          </div>
          {viewsByDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados para o período selecionado.</p>
          ) : (
            <div className="space-y-2">
              {viewsByDay.slice(-14).map((point) => {
                const max = Math.max(...viewsByDay.map((item) => item.value), 1)
                const width = Math.max(6, Math.round((point.value / max) * 100))
                return (
                  <div className="grid grid-cols-[96px_1fr_48px] items-center gap-2" key={point.date}>
                    <span className="text-xs text-muted-foreground">{point.date}</span>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-xs text-foreground">{point.value}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Mix de dispositivos</h2>
          </div>
          {deviceMix.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos de acesso no período.</p>
          ) : (
            <div className="space-y-2">
              {deviceMix.map((item) => (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminDataTable
          columns={[
            { header: 'Página', cell: (row) => <span className="text-sm text-foreground">{row.label}</span> },
            { header: 'Acessos', className: 'text-right', cell: (row) => <span className="text-sm font-semibold text-foreground">{row.value}</span> },
          ]}
          data={topPages}
          emptyDescription="Sem páginas com acessos no recorte selecionado."
          emptyTitle="Top páginas indisponível"
          getRowKey={(row) => `${row.label}-${row.value}`}
          isError={Boolean(analyticsQuery.error)}
          isLoading={analyticsQuery.isLoading}
          minWidth="min-w-[520px]"
        />

        <AdminDataTable
          columns={[
            { header: 'Alvo do clique', cell: (row) => <span className="text-sm text-foreground">{row.label}</span> },
            { header: 'Cliques', className: 'text-right', cell: (row) => <span className="text-sm font-semibold text-foreground">{row.value}</span> },
          ]}
          data={topClicks}
          emptyDescription="Sem cliques rastreados para o período selecionado."
          emptyTitle="Top cliques indisponível"
          getRowKey={(row) => `${row.label}-${row.value}`}
          isError={Boolean(analyticsQuery.error)}
          isLoading={analyticsQuery.isLoading}
          minWidth="min-w-[520px]"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminDataTable
          columns={[
            { header: 'UF', cell: (row) => <span className="text-sm text-foreground">{row.label}</span> },
            { header: 'Registros', className: 'text-right', cell: (row) => <span className="text-sm font-semibold text-foreground">{row.value}</span> },
          ]}
          data={locality}
          emptyDescription="Sem localidade operacional no recorte selecionado."
          emptyTitle="Localidade indisponível"
          getRowKey={(row) => `${row.label}-${row.value}`}
          isError={Boolean(analyticsQuery.error)}
          isLoading={analyticsQuery.isLoading}
          minWidth="min-w-[420px]"
        />

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MousePointerClick className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Leitura operacional</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Período: {formatNotificationDateTime(effectiveRange.startAt)} até {formatNotificationDateTime(effectiveRange.endAt)}</li>
            <li>Conversão por clique (CTR): {(data?.ctr ?? 0).toFixed(2)}%</li>
            <li>Retorno de usuários: {data?.recurringUsers ?? 0} recorrentes</li>
            <li>Tempo médio por página: {formatDuration(data?.avgNavigationSeconds ?? 0)}</li>
            <li>Sessões únicas: {data?.uniqueSessions ?? 0}</li>
          </ul>
        </section>
      </div>
    </section>
  )
}
