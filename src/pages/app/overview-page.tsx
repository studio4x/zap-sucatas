import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileClock, FilePlus2, MessageSquareMore, Rows4 } from 'lucide-react'
import { paths } from '@/app/paths'
import { DashboardActionCard } from '@/components/dashboard/dashboard-action-card'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { DashboardTableCard } from '@/components/dashboard/dashboard-table-card'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { fetchUserListings } from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'
import { fetchOwnerQuestions } from '@/domains/questions/api'
import { useAuth } from '@/hooks/use-auth'

export function AppOverviewPage() {
  const { user } = useAuth()

  const listingsQuery = useQuery({
    queryKey: ['listings', 'owner', user?.profileId],
    queryFn: () => fetchUserListings(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const questionsQuery = useQuery({
    queryKey: ['questions', 'owner', user?.profileId],
    queryFn: () => fetchOwnerQuestions(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data])
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data])
  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      drafts: listings.filter((listing) => listing.status === 'draft').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      unansweredQuestions: questions.filter((question) => !question.answer).length,
    }),
    [listings, questions],
  )
  const recentListings = listings.slice(0, 5)

  const nextStepAlert = (() => {
    if (stats.rejected > 0) {
      return {
        description:
          'Você tem anúncios rejeitados. Revise o motivo, ajuste os dados e envie novamente para análise.',
        title: 'Existem anúncios que precisam de correção',
        tone: 'warning' as const,
      }
    }

    if (stats.pending > 0) {
      return {
        description:
          'Seus anúncios em revisão aguardam liberação do time administrativo. Você pode acompanhar os status na lista completa.',
        title: 'Seus anúncios estão em análise',
        tone: 'info' as const,
      }
    }

    if (listings.length === 0) {
      return {
        description:
          'Seu dashboard está pronto. O primeiro passo é criar um anúncio com fotos, localidade e descrição completa.',
        title: 'Comece publicando o primeiro anúncio',
        tone: 'success' as const,
      }
    }

    return {
      description:
        'Sua área está operando normalmente. Continue acompanhando perguntas e mantendo os anúncios atualizados.',
      title: 'Tudo certo por aqui',
      tone: 'success' as const,
    }
  })()

  return (
    <section className="space-y-6 [&>*]:min-w-0">
      <DashboardSectionHeader
        action={
          <Button asChild type="button">
            <Link to={paths.app.newListing}>
              <FilePlus2 className="size-4" />
              Criar anúncio
            </Link>
          </Button>
        }
        description="Acompanhe seus anúncios, veja o que exige atenção agora e entre rápido nas ações principais da conta."
        title="Visão geral"
      />

      <DashboardAlertCard
        action={
          <Button asChild size="sm" type="button" variant="outline">
            <Link to={paths.app.listings}>Abrir meus anúncios</Link>
          </Button>
        }
        description={nextStepAlert.description}
        title={nextStepAlert.title}
        tone={nextStepAlert.tone}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          description="Itens que ainda podem ser ajustados antes do envio."
          label="Rascunhos"
          value={stats.drafts}
        />
        <DashboardStatCard
          description="Anúncios aguardando moderação da plataforma."
          label="Em revisão"
          tone={stats.pending > 0 ? 'warning' : 'default'}
          value={stats.pending}
        />
        <DashboardStatCard
          description="Publicações já liberadas para o catálogo público."
          label="Aprovados"
          tone={stats.approved > 0 ? 'success' : 'default'}
          value={stats.approved}
        />
        <DashboardStatCard
          description="Perguntas recebidas que ainda esperam uma resposta."
          label="Sem resposta"
          tone={stats.unansweredQuestions > 0 ? 'warning' : 'default'}
          value={stats.unansweredQuestions}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <DashboardTableCard
          columns={[
            {
              header: 'Anuncio',
              cell: (listing) => (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.city} - {listing.state}
                  </p>
                </div>
              ),
            },
            {
              header: 'Status',
              className: 'w-[140px]',
              cell: (listing) => <ListingStatusBadge status={listing.status} />,
            },
            {
              header: 'Atualizado',
              className: 'w-[180px]',
              cell: (listing) => (
                <span className="text-sm text-muted-foreground">{formatListingDate(listing.updatedAt)}</span>
              ),
            },
            {
              header: 'Acao',
              className: 'w-[120px] text-right',
              cell: (listing) => (
                <Button asChild size="sm" type="button" variant="ghost">
                  <Link to={paths.app.editListing(listing.id)}>Abrir</Link>
                </Button>
              ),
            },
          ]}
          data={recentListings}
          description="Seus anúncios mais recentes com acesso rápido para revisar ou editar."
          emptyDescription="Quando você criar o primeiro anúncio, ele vai aparecer aqui com o status mais recente."
          emptyTitle="Nenhum anúncio ainda"
          errorMessage="Não foi possível carregar seus anúncios."
          getRowKey={(listing) => listing.id}
          isError={listingsQuery.isError}
          isLoading={listingsQuery.isLoading}
          title="Últimos anúncios"
        />

        <div className="grid gap-4">
          <DashboardActionCard
            action={
              <Button asChild className="w-full" type="button">
                <Link to={paths.app.newListing}>
                  <FilePlus2 className="size-4" />
                  Criar novo anúncio
                </Link>
              </Button>
            }
            description="Comece um novo anúncio com descrição, localidade, fotos e dados comerciais."
            icon={<FilePlus2 className="size-5" />}
            title="Publicar novo lote"
            tone="primary"
          />

          <DashboardActionCard
            action={
              <Button asChild className="w-full" type="button" variant="outline">
                <Link to={paths.app.questions}>
                  <MessageSquareMore className="size-4" />
                  Ver perguntas
                </Link>
              </Button>
            }
            description="Acompanhe as perguntas recebidas e mantenha sua resposta em dia."
            icon={<MessageSquareMore className="size-5" />}
            title="Responder interessados"
          />

          <DashboardActionCard
            action={
              <Button asChild className="w-full" type="button" variant="outline">
                <Link to={paths.app.listings}>
                  <Rows4 className="size-4" />
                  Gerenciar anúncios
                </Link>
              </Button>
            }
            description="Revise rascunhos, corrija rejeições e acompanhe a fila de revisão."
            icon={<FileClock className="size-5" />}
            title="Organizar publicações"
            tone={stats.rejected > 0 || stats.pending > 0 ? 'warning' : 'default'}
          />
        </div>
      </div>
    </section>
  )
}
