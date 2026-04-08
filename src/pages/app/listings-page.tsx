import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, FilePlus2, SendHorizontal } from 'lucide-react'
import { paths } from '@/app/paths'
import { DashboardActionCard } from '@/components/dashboard/dashboard-action-card'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { DashboardFilterCard } from '@/components/dashboard/dashboard-filter-card'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { DashboardTableCard } from '@/components/dashboard/dashboard-table-card'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchUserListings, submitListingForReview } from '@/domains/listings/api'
import { formatListingDate, listingStatusFilterOptions } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

type AppListingsStatusFilter =
  (typeof listingStatusFilterOptions)[number]['value']

export function AppListingsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppListingsStatusFilter>('all')

  const listingsQuery = useQuery({
    queryKey: ['listings', 'owner', user?.profileId],
    queryFn: () => fetchUserListings(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const submitMutation = useMutation({
    mutationFn: submitListingForReview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user?.profileId] })
    },
  })

  const listings = listingsQuery.data ?? []
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return listings.filter((listing) => {
      const matchesStatus = statusFilter === 'all' ? true : listing.status === statusFilter
      const haystack =
        `${listing.title} ${listing.summary ?? ''} ${listing.city} ${listing.state}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [listings, query, statusFilter])

  const stats = useMemo(
    () => ({
      approved: listings.filter((listing) => listing.status === 'approved').length,
      drafts: listings.filter((listing) => listing.status === 'draft').length,
      pending: listings.filter((listing) => listing.status === 'pending_review').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      total: listings.length,
    }),
    [listings],
  )

  const requiresAttention = listings.find(
    (listing) => listing.status === 'rejected' || listing.status === 'draft',
  )

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        action={
          <Button asChild type="button">
            <Link to={paths.app.newListing}>
              <FilePlus2 className="size-4" />
              Novo anuncio
            </Link>
          </Button>
        }
        description="Gerencie seus anuncios em um unico lugar, acompanhe os status e envie itens prontos para revisao."
        title="Meus anuncios"
      />

      {requiresAttention ? (
        <DashboardAlertCard
          action={
            <Button asChild size="sm" type="button" variant="outline">
              <Link to={paths.app.editListing(requiresAttention.id)}>Abrir anuncio</Link>
            </Button>
          }
          description={
            requiresAttention.status === 'rejected'
              ? 'Existe um anuncio rejeitado aguardando ajuste. Revise o motivo, corrija o conteudo e reenvie.'
              : 'Voce ainda tem rascunhos sem envio para revisao. Complete o que faltar e publique quando estiver pronto.'
          }
          title={
            requiresAttention.status === 'rejected'
              ? 'Existe um anuncio com correcao pendente'
              : 'Voce tem rascunhos para concluir'
          }
          tone="warning"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Total" value={stats.total} />
        <DashboardStatCard label="Rascunhos" value={stats.drafts} />
        <DashboardStatCard
          label="Em revisao"
          tone={stats.pending > 0 ? 'warning' : 'default'}
          value={stats.pending}
        />
        <DashboardStatCard
          label="Aprovados"
          tone={stats.approved > 0 ? 'success' : 'default'}
          value={stats.approved}
        />
        <DashboardStatCard
          label="Rejeitados"
          tone={stats.rejected > 0 ? 'warning' : 'default'}
          value={stats.rejected}
        />
      </div>

      <DashboardFilterCard
        actions={
          <Button
            onClick={() => {
              setQuery('')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Use os filtros para localizar rapido um lote especifico ou acompanhar um status."
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por titulo, cidade ou resumo"
            value={query}
          />
          <Select
            onChange={(event) => setStatusFilter(event.target.value as AppListingsStatusFilter)}
            value={statusFilter}
          >
            {listingStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </DashboardFilterCard>

      {listingsQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
          Carregando anuncios do dashboard...
        </div>
      ) : null}

      {listingsQuery.isError ? (
        <DashboardAlertCard
          description="Nao foi possivel carregar seus anuncios nesta tentativa."
          title="Falha ao carregar anuncios"
          tone="error"
        />
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError && filteredListings.length === 0 ? (
        <DashboardEmptyState
          action={
            <Button asChild type="button">
              <Link to={paths.app.newListing}>Criar anuncio</Link>
            </Button>
          }
          description="Ajuste os filtros ou crie seu primeiro anuncio para começar a publicar no marketplace."
          title="Nenhum anuncio encontrado"
        />
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError && filteredListings.length > 0 ? (
        <DashboardTableCard
          columns={[
            {
              header: 'Anuncio',
              cell: (listing) => (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.summary || listing.description}
                  </p>
                </div>
              ),
            },
            {
              header: 'Status',
              className: 'w-[150px]',
              cell: (listing) => <ListingStatusBadge status={listing.status} />,
            },
            {
              header: 'Contexto',
              className: 'w-[220px]',
              cell: (listing) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {listing.city} - {listing.state}
                  </p>
                  <p>Atualizado em {formatListingDate(listing.updatedAt)}</p>
                </div>
              ),
            },
            {
              header: 'Acoes',
              className: 'w-[260px] text-right',
              cell: (listing) => {
                const canSubmit =
                  listing.status === 'draft' ||
                  listing.status === 'rejected' ||
                  listing.status === 'paused'

                return (
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link to={paths.app.editListing(listing.id)}>Editar</Link>
                    </Button>

                    {listing.slug ? (
                      <Button asChild size="sm" type="button" variant="ghost">
                        <Link to={paths.public.listingDetails(listing.slug)}>
                          <Eye className="size-4" />
                          Publico
                        </Link>
                      </Button>
                    ) : null}

                    {canSubmit ? (
                      <Button
                        disabled={submitMutation.isPending}
                        onClick={() => submitMutation.mutate(listing.id)}
                        size="sm"
                        type="button"
                      >
                        <SendHorizontal className="size-4" />
                        {submitMutation.isPending ? 'Enviando...' : 'Revisao'}
                      </Button>
                    ) : null}
                  </div>
                )
              },
            },
          ]}
          data={filteredListings}
          description="Tabela operacional com seus anuncios, status atuais e atalhos de edicao."
          emptyDescription="Nenhum anuncio encontrado."
          emptyTitle="Sem anuncios"
          getRowKey={(listing) => listing.id}
          minWidth="min-w-[940px]"
          title="Lista de anuncios"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardActionCard
          action={
            <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
              <Link to={paths.app.profile}>Atualizar dados de contato</Link>
            </Button>
          }
          description="Mantenha nome, telefone e dados da conta sempre atualizados para facilitar a negociacao."
          title="Perfil e dados comerciais"
        />

        <DashboardActionCard
          action={
            <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
              <Link to={paths.app.questions}>Abrir perguntas</Link>
            </Button>
          }
          description="As perguntas recebidas ficam centralizadas e podem virar novas oportunidades."
          title="Inbox de perguntas"
        />
      </div>
    </section>
  )
}
