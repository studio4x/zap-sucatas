import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileClock, LifeBuoy, MessageSquare, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { Button } from '@/components/ui/button'
import { fetchAdminListings } from '@/domains/listings/api'
import { fetchAdminProfiles } from '@/domains/profiles/api'
import { fetchAdminQuestions } from '@/domains/questions/api'
import { fetchAdminSupportTickets } from '@/domains/support/api'

export function AdminOverviewPage() {
  const listingsQuery = useQuery({
    queryKey: ['listings', 'admin'],
    queryFn: () => fetchAdminListings(),
  })
  const questionsQuery = useQuery({
    queryKey: ['questions', 'admin'],
    queryFn: fetchAdminQuestions,
  })
  const profilesQuery = useQuery({
    queryKey: ['profiles', 'admin'],
    queryFn: fetchAdminProfiles,
  })
  const supportTicketsQuery = useQuery({
    queryKey: ['support', 'admin', 'overview'],
    queryFn: fetchAdminSupportTickets,
  })

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data])
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data])
  const profiles = useMemo(() => profilesQuery.data ?? [], [profilesQuery.data])
  const supportTickets = useMemo(() => supportTicketsQuery.data ?? [], [supportTicketsQuery.data])

  const stats = useMemo(
    () => ({
      pendingListings: listings.filter((listing) => listing.status === 'pending_review').length,
      publishedQuestions: questions.filter((question) => question.status === 'published').length,
      overdueSupportTickets: supportTickets.filter((ticket) => ticket.slaStatus === 'overdue').length,
      unresolvedSupportTickets: supportTickets.filter((ticket) => ticket.status !== 'closed').length,
      totalAdmins: profiles.filter((profile) => profile.role === 'admin').length,
      totalUsers: profiles.length,
    }),
    [listings, profiles, questions, supportTickets],
  )

  return (
    <section className="space-y-6 [&>*]:min-w-0">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Fila de anúncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.pricing}>
                <SlidersHorizontal className="size-4" />
                Preços
              </Link>
            </Button>
          </>
        }
        description="Acompanhe a fila prioritária do MVP e entre rápido nos módulos de moderação e operação."
        eyebrow="Administração / visão geral"
        title="Operação administrativa"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suporte no topo da fila</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
              <LifeBuoy className="size-4 text-primary" />
              <span className="break-words [overflow-wrap:anywhere]">
                {stats.unresolvedSupportTickets} ticket{stats.unresolvedSupportTickets === 1 ? '' : 's'} em aberto
              </span>
            </div>
            <div className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              stats.overdueSupportTickets > 0
                ? 'border-[#e7c1b9] bg-[#fff5f2] text-[#8f3326]'
                : 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]'
            }`}>
              <span className="break-words [overflow-wrap:anywhere]">{stats.overdueSupportTickets} com SLA vencido</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {stats.overdueSupportTickets > 0
              ? 'A central de suporte exige triagem imediata para evitar aumento de fila e atraso operacional.'
              : 'A fila de suporte está controlada neste momento, sem chamados vencidos no SLA de primeira resposta.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ação rápida</p>
          <p className="mt-2 text-sm leading-6 text-foreground">Abra a central de tickets para responder a fila pendente ou revisar os chamados vencidos.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="w-full sm:w-auto" type="button">
              <Link to={paths.admin.support}>Abrir tickets</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
              <Link to={`${paths.admin.support}?sla=overdue`}>Ver SLA vencido</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          description="Itens que exigem decisão editorial imediata."
          label="Anúncios pendentes"
          value={stats.pendingListings}
        />
        <AdminStatCard
          description="Threads atualmente visíveis na área pública."
          label="Perguntas publicadas"
          value={stats.publishedQuestions}
        />
        <AdminStatCard
          description="Perfis com acesso administrativo ativo."
          label="Admins"
          value={stats.totalAdmins}
        />
        <AdminStatCard
          className={stats.overdueSupportTickets > 0 ? 'border-[#e7c1b9] bg-[#fff7f4]' : undefined}
          description={
            stats.overdueSupportTickets > 0
              ? 'Tickets sem primeira resposta dentro do SLA configurado.'
              : 'Nenhum ticket com primeira resposta fora do prazo.'
          }
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.support}>
              Abrir central de suporte
            </Link>
          }
          label="Tickets pendentes"
          value={stats.unresolvedSupportTickets}
        />
        <AdminStatCard
          description="Base autenticada do marketplace no momento."
          label="Usuários"
          value={stats.totalUsers}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          description="Atalho rápido para threads pendentes de moderação."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.questions}>
              Abrir perguntas
            </Link>
          }
          label="Moderação de perguntas"
          value={<MessageSquare className="size-6" />}
        />
        <AdminStatCard
          description="Fila de suporte com leitura rápida de pendências e SLA."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.support}>
              Ver tickets
            </Link>
          }
          label="Suporte"
          value={<LifeBuoy className="size-6" />}
        />
        <AdminStatCard
          description="Estado geral de controle e governança da operação."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.settings}>
              Ver configurações
            </Link>
          }
          label="Governança"
          value={<ShieldCheck className="size-6" />}
        />
        <AdminStatCard
          description="Catálogo interno pronto para ajustes e moderação."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.listings}>
              Ir para anúncios
            </Link>
          }
          label="Moderação ativa"
          value={<FileClock className="size-6" />}
        />
      </div>
    </section>
  )
}
