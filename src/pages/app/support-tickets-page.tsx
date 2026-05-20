import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare, PlusCircle } from 'lucide-react'
import { paths } from '@/app/paths'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { SupportTicketModal } from '@/components/support/support-ticket-modal'
import { TicketSlaBadge } from '@/components/support/ticket-sla-badge'
import { TicketStatusBadge } from '@/components/support/ticket-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchMySupportTickets, fetchSupportConfig } from '@/domains/support/api'
import { useAuth } from '@/hooks/use-auth'
import { defaultSupportConfig, formatBusinessHours, formatSupportDateTime, getSupportCategoryMeta } from '@/lib/support-sla'

export function AppSupportTicketsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('openTicketModal') === '1')
  const ticketStep = searchParams.get('ticketStep') === 'form' ? 'form' : 'choice'

  useEffect(() => {
    setIsModalOpen(searchParams.get('openTicketModal') === '1')
  }, [searchParams])

  const ticketsQuery = useQuery({
    queryKey: ['support', 'tickets', user?.profileId],
    queryFn: () => fetchMySupportTickets(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })
  const configQuery = useQuery({ queryKey: ['support', 'config', 'app-list'], queryFn: fetchSupportConfig })

  const config = configQuery.data ?? defaultSupportConfig
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data])

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        action={
          <>
            <Button asChild type="button" variant="outline"><Link to={paths.public.support}>Ver FAQs</Link></Button>
            <Button onClick={() => setIsModalOpen(true)} type="button"><PlusCircle className="size-4" /> Novo chamado</Button>
          </>
        }
        description="Acompanhe os chamados abertos, o prazo da primeira resposta e o historico de conversas com a equipe."
        title="Meus chamados"
      />

      <Card className="rounded-[1.8rem] bg-primary/5 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">SLA publico de primeira resposta</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Pagamentos em ate 2 horas uteis. Demais categorias em ate 24 horas uteis.</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">{formatBusinessHours(config.businessHours)}</p>
          </div>
          <div className="inline-flex rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Nao e prazo de resolucao final</div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.8rem] shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        <CardContent className="p-0">
          {ticketsQuery.isLoading ? <div className="px-6 py-8 text-sm text-muted-foreground">Carregando chamados...</div> : null}
          {ticketsQuery.isError ? <div className="px-6 py-8 text-sm text-destructive">Nao foi possivel carregar os chamados.</div> : null}
          {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 ? (
            <div className="p-6"><DashboardEmptyState description="Voce ainda nao abriu nenhum chamado." icon={MessageSquare} title="Nenhum chamado encontrado" /></div>
          ) : null}
          {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    {['Assunto', 'Categoria', 'Status', 'SLA', 'Prazo', 'Acoes'].map((header) => <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground" key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const category = getSupportCategoryMeta(config, ticket.category)
                    return (
                      <tr className="border-t border-border align-top" key={ticket.id}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Aberto em {formatSupportDateTime(ticket.createdAt)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{category.label}</div>
                          <p className="mt-2 text-xs text-muted-foreground">{category.description}</p>
                        </td>
                        <td className="px-4 py-4"><TicketStatusBadge status={ticket.status} /></td>
                        <td className="px-4 py-4"><TicketSlaBadge status={ticket.slaStatus} /></td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{ticket.firstResponseAt ? `Respondido em ${formatSupportDateTime(ticket.firstResponseAt)}` : ticket.firstResponseDueAt ? formatSupportDateTime(ticket.firstResponseDueAt) : 'Em calculo'}</td>
                        <td className="px-4 py-4"><Button asChild type="button" variant="ghost"><Link to={paths.app.supportDetail(ticket.id)}>Ver detalhes</Link></Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SupportTicketModal
        initialStep={ticketStep}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open && searchParams.get('openTicketModal')) {
            searchParams.delete('openTicketModal')
            searchParams.delete('ticketStep')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        open={isModalOpen}
      />
    </section>
  )
}
