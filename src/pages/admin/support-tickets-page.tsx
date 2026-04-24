import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Search, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { TicketSlaBadge } from '@/components/support/ticket-sla-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { deleteSupportTicket, fetchAdminSupportTickets, fetchSupportConfig, updateSupportTicketStatus } from '@/domains/support/api'
import type { SupportTicketCategory, SupportTicketStatus, SupportTicketWithUser } from '@/domains/support/types'
import { defaultSupportConfig, formatSupportDateTime, getSupportCategoryMeta, getSupportPriorityMeta } from '@/lib/support-sla'

export function AdminSupportTicketsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | SupportTicketCategory>('all')
  const [slaFilter, setSlaFilter] = useState<'all' | 'overdue'>(() => (searchParams.get('sla') === 'overdue' ? 'overdue' : 'all'))
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'sla'>('sla')
  const [deletingTicket, setDeletingTicket] = useState<SupportTicketWithUser | null>(null)

  const ticketsQuery = useQuery({ queryKey: ['support', 'admin', 'tickets'], queryFn: fetchAdminSupportTickets })
  const configQuery = useQuery({ queryKey: ['support', 'config', 'admin-list'], queryFn: fetchSupportConfig })

  const statusMutation = useMutation({
    mutationFn: (input: { status: SupportTicketStatus; ticketId: string }) => updateSupportTicketStatus(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
      ])
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteSupportTicket,
    onSuccess: async () => {
      setDeletingTicket(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
      ])
    },
  })

  const config = configQuery.data ?? defaultSupportConfig
  useEffect(() => {
    setSlaFilter(searchParams.get('sla') === 'overdue' ? 'overdue' : 'all')
  }, [searchParams])

  function updateSlaFilter(nextValue: 'all' | 'overdue') {
    setSlaFilter(nextValue)
    const nextParams = new URLSearchParams(searchParams)
    if (nextValue === 'overdue') {
      nextParams.set('sla', 'overdue')
    } else {
      nextParams.delete('sla')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const tickets = useMemo(() => {
    const rows = [...(ticketsQuery.data ?? [])]
      .filter((ticket) => {
        const normalizedQuery = query.trim().toLowerCase()
        const haystack = `${ticket.subject} ${ticket.userFullName ?? ''} ${ticket.userEmail ?? ''}`.toLowerCase()
        const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)
        const matchesStatus = statusFilter === 'all' ? true : ticket.status === statusFilter
        const matchesCategory = categoryFilter === 'all' ? true : ticket.category === categoryFilter
        const matchesSla = slaFilter === 'all' ? true : ticket.slaStatus === 'overdue'
        return matchesQuery && matchesStatus && matchesCategory && matchesSla
      })

    rows.sort((left, right) => {
      if (sortBy === 'priority') {
        const weights = { urgent: 4, high: 3, medium: 2, low: 1 }
        const diff = weights[right.priority] - weights[left.priority]
        if (diff !== 0) {
          return diff
        }
      }

      if (sortBy === 'date') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }

      const leftAnswered = left.firstResponseAt ? 1 : 0
      const rightAnswered = right.firstResponseAt ? 1 : 0
      if (leftAnswered !== rightAnswered) {
        return leftAnswered - rightAnswered
      }

      const leftDue = left.firstResponseDueAt ? new Date(left.firstResponseDueAt).getTime() : Number.MAX_SAFE_INTEGER
      const rightDue = right.firstResponseDueAt ? new Date(right.firstResponseDueAt).getTime() : Number.MAX_SAFE_INTEGER
      if (leftDue !== rightDue) {
        return leftDue - rightDue
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    })

    return rows
  }, [categoryFilter, query, slaFilter, sortBy, statusFilter, ticketsQuery.data])

  const overdueCount = tickets.filter((ticket) => ticket.slaStatus === 'overdue').length

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={<Button onClick={() => queryClient.invalidateQueries({ queryKey: ['support', 'admin'] })} type="button" variant="outline">Atualizar lista</Button>}
        description="Fila operacional de tickets com busca, filtros de triagem e acesso ao detalhe compartilhado do chamado."
        eyebrow="Admin / suporte"
        title="Central de atendimento"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard helper="Pagamentos em ate 2h uteis. Demais categorias em ate 24h uteis." label="SLA publico" value="2h / 24h" />
        <AdminStatCard label="Chamados filtrados" value={tickets.length} />
        <AdminStatCard helper={overdueCount > 0 ? 'Ha chamados com primeira resposta fora do prazo.' : 'Nenhum chamado atrasado neste recorte.'} label="SLA atrasado" value={overdueCount} />
      </div>

      <AdminFilterCard
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => updateSlaFilter(slaFilter === 'overdue' ? 'all' : 'overdue')}
              type="button"
              variant={slaFilter === 'overdue' ? 'default' : 'outline'}
            >
              Somente SLA vencido
            </Button>
            <Button
              onClick={() => {
                setQuery('')
                setStatusFilter('all')
                setCategoryFilter('all')
                updateSlaFilter('all')
                setSortBy('sla')
              }}
              type="button"
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        }
        description="Busque por assunto, nome ou e-mail e organize a fila pela urgencia operacional do backoffice."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por assunto, nome ou e-mail..." value={query} />
          </div>
          <Select onChange={(event) => setStatusFilter(event.target.value as 'all' | SupportTicketStatus)} value={statusFilter}>
            <option value="all">Todos os status</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em atendimento</option>
            <option value="closed">Fechados</option>
          </Select>
          <Select onChange={(event) => setCategoryFilter(event.target.value as 'all' | SupportTicketCategory)} value={categoryFilter}>
            <option value="all">Todas as categorias</option>
            {config.categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
          </Select>
          <Select onChange={(event) => setSortBy(event.target.value as 'date' | 'priority' | 'sla')} value={sortBy}>
            <option value="sla">Ordenar por SLA</option>
            <option value="priority">Ordenar por prioridade</option>
            <option value="date">Ordenar por data</option>
          </Select>
          <div className="flex items-center rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
            {slaFilter === 'overdue' ? 'Filtro rapido: SLA vencido' : 'Filtro rapido desativado'}
          </div>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Usuario',
            cell: (ticket) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{ticket.userFullName ?? 'Usuario autenticado'}</p>
                <p className="text-xs text-muted-foreground">{ticket.userEmail ?? 'Sem e-mail'}</p>
              </div>
            ),
          },
          {
            header: 'Assunto',
            cell: (ticket) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground line-clamp-2">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">{formatSupportDateTime(ticket.createdAt)}</p>
              </div>
            ),
          },
          {
            header: 'Categoria',
            cell: (ticket) => {
              const category = getSupportCategoryMeta(config, ticket.category)
              return <div className="space-y-1"><div className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{category.label}</div><p className="text-xs text-muted-foreground">{category.description}</p></div>
            },
          },
          { header: 'SLA', cell: (ticket) => <TicketSlaBadge status={ticket.slaStatus} /> },
          { header: 'Prioridade', cell: (ticket) => <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSupportPriorityMeta(ticket.priority).tone === 'danger' ? 'border-[#f0c4bd] bg-[#fff1ee] text-[#a53c2f]' : getSupportPriorityMeta(ticket.priority).tone === 'warning' ? 'border-[#ead4a4] bg-[#fff7e8] text-[#8f6512]' : 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]'}`}>{getSupportPriorityMeta(ticket.priority).label}</span> },
          {
            header: 'Status',
            cell: (ticket) => (
              <Select disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate({ status: event.target.value as SupportTicketStatus, ticketId: ticket.id })} value={ticket.status}>
                <option value="open">Aberto</option>
                <option value="in_progress">Em atendimento</option>
                <option value="closed">Fechado</option>
              </Select>
            ),
          },
          { header: 'Prazo', cell: (ticket) => <span className="text-sm text-muted-foreground">{ticket.firstResponseAt ? `Respondido em ${formatSupportDateTime(ticket.firstResponseAt)}` : ticket.firstResponseDueAt ? formatSupportDateTime(ticket.firstResponseDueAt) : 'Em calculo'}</span> },
          {
            header: 'Acoes',
            className: 'text-right w-[140px]',
            cell: (ticket) => <AdminRowActions actions={[{ icon: MessageSquare, label: 'Responder', to: paths.admin.supportDetail(ticket.id) }, { icon: Trash2, label: 'Excluir', onClick: () => setDeletingTicket(ticket), variant: 'ghost' }]} />,
          },
        ]}
        data={tickets}
        emptyDescription="Nenhum chamado encontrado."
        emptyTitle="Fila vazia"
        errorMessage="Nao foi possivel carregar os tickets do suporte."
        getRowKey={(ticket) => ticket.id}
        isError={ticketsQuery.isError || configQuery.isError}
        isLoading={ticketsQuery.isLoading || configQuery.isLoading}
        rowClassName={(ticket) => getSupportPriorityMeta(ticket.priority).rowClassName}
      />

      <ConfirmActionDialog
        confirmLabel="Confirmar exclusao"
        description={deletingTicket ? `O chamado \"${deletingTicket.subject}\" e todo o historico serao removidos permanentemente.` : ''}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingTicket) {
            deleteMutation.mutate(deletingTicket.id)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTicket(null)
          }
        }}
        open={Boolean(deletingTicket)}
        title="Excluir chamado permanentemente"
      />
    </section>
  )
}
