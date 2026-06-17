import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { fetchAdminSitePages, updateBlogPageVisibility, updateSitePageVisibility } from '@/domains/site-pages/api'
import type { AdminSitePageRecord } from '@/domains/site-pages/types'
import { fetchSystemSettings } from '@/domains/settings/api'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

type PageStatusFilter = 'all' | 'online' | 'offline'

function getStatusMeta(isOnline: boolean) {
  return isOnline
    ? { label: 'Online', tone: 'success' as const }
    : { label: 'Offline', tone: 'danger' as const }
}

export function AdminSitePagesPage() {
  const queryClient = useQueryClient()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PageStatusFilter>('all')

  const pagesQuery = useQuery({
    queryKey: ['site-pages', 'admin'],
    queryFn: fetchAdminSitePages,
  })

  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const pageMutation = useMutation({
    mutationFn: async (page: AdminSitePageRecord) => {
      if (page.source === 'system_settings') {
        if (!settingsQuery.data?.id) {
          throw new Error('Configuração do blog indisponível para atualização.')
        }

        return updateBlogPageVisibility({
          enabled: !page.isOnline,
          settingsId: settingsQuery.data.id,
        })
      }

      return updateSitePageVisibility({
        isOnline: !page.isOnline,
        pageId: page.id,
      })
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível atualizar a visibilidade da página.')
    },
    onSuccess: async (_data, page) => {
      setSuccessFeedback(
        page.isOnline
          ? `Página ${page.title} desativada com sucesso.`
          : `Página ${page.title} ativada com sucesso.`,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['site-pages'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
      ])
    },
  })

  const pages = useMemo(() => pagesQuery.data ?? [], [pagesQuery.data])
  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return pages.filter((page) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'online'
            ? page.isOnline
            : !page.isOnline

      const haystack = `${page.title} ${page.path} ${page.section} ${page.description}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [pages, query, statusFilter])

  const stats = useMemo(
    () => ({
      offline: pages.filter((page) => !page.isOnline).length,
      online: pages.filter((page) => page.isOnline).length,
      total: pages.length,
    }),
    [pages],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <Button asChild type="button" variant="outline">
            <Link to={paths.public.home}>
              <ExternalLink className="size-4" />
              Abrir site
            </Link>
          </Button>
        }
        description="Gerencie as páginas públicas da Zap Sucatas e defina o que fica disponível no site."
        eyebrow="Administração / páginas"
        title="Páginas do site"
      />

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Online" value={stats.online} />
        <AdminStatCard label="Offline" value={stats.offline} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              clearFeedback()
              setQuery('')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Use a busca para localizar uma página e altere o status online/offline diretamente na linha."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, caminho ou seção"
            value={query}
          />
          <Select onChange={(event) => setStatusFilter(event.target.value as PageStatusFilter)} value={statusFilter}>
            <option value="all">Todos os status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Página',
            id: 'page',
            cell: (page) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{page.title}</p>
                <p className="text-xs text-muted-foreground">{page.description}</p>
              </div>
            ),
          },
          {
            header: 'Caminho',
            id: 'path',
            cell: (page) => <p className="text-sm text-muted-foreground">{page.path}</p>,
          },
          {
            header: 'Seção',
            id: 'section',
            cell: (page) => <p className="text-sm text-muted-foreground">{page.section}</p>,
          },
          {
            header: 'Origem',
            id: 'source',
            cell: (page) => (
              <AdminStatusBadge tone={page.source === 'system_settings' ? 'info' : 'neutral'}>
                {page.source === 'system_settings' ? 'Configurações' : 'Banco'}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Status',
            id: 'status',
            cell: (page) => (
              <AdminStatusBadge tone={getStatusMeta(page.isOnline).tone}>
                {getStatusMeta(page.isOnline).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Visibilidade',
            className: 'w-[180px] text-right',
            id: 'visibility',
            cell: (page) => (
              <div className="flex items-center justify-end gap-3">
                <span className="text-xs text-muted-foreground">{page.isOnline ? 'Ativa' : 'Inativa'}</span>
                <Switch
                  checked={page.isOnline}
                  disabled={pageMutation.isPending || settingsQuery.isLoading || pagesQuery.isLoading}
                  onCheckedChange={() => {
                    clearFeedback()
                    pageMutation.mutate(page)
                  }}
                />
              </div>
            ),
          },
        ]}
        data={filteredPages}
        emptyDescription="Nenhuma página corresponde ao filtro atual."
        emptyTitle="Sem páginas"
        errorMessage="Não foi possível carregar as páginas do site."
        getRowKey={(page) => page.id}
        isError={pagesQuery.isError || settingsQuery.isError}
        isLoading={pagesQuery.isLoading || settingsQuery.isLoading}
        minWidth="min-w-[1120px]"
      />
    </section>
  )
}
