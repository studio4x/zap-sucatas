import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, FileClock, MessageSquare, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminListings } from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'
import { fetchAdminProfiles } from '@/domains/profiles/api'
import { fetchAdminQuestions } from '@/domains/questions/api'

const PAGE_SIZE = 8

function getListingStatusMeta(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'Aprovado', tone: 'success' as const }
    case 'pending_review':
      return { label: 'Em revisao', tone: 'info' as const }
    case 'rejected':
      return { label: 'Rejeitado', tone: 'danger' as const }
    case 'paused':
      return { label: 'Pausado', tone: 'warning' as const }
    case 'draft':
      return { label: 'Rascunho', tone: 'neutral' as const }
    default:
      return { label: 'Arquivado', tone: 'neutral' as const }
  }
}

export function AdminOverviewPage() {
  const [focusFilter, setFocusFilter] = useState<'all' | 'approved' | 'pending_review' | 'rejected'>('pending_review')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

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

  const listings = listingsQuery.data ?? []
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return listings.filter((listing) => {
      const matchesFilter = focusFilter === 'all' ? true : listing.status === focusFilter
      const haystack =
        `${listing.title} ${listing.categoryName ?? ''} ${listing.city} ${listing.state}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [focusFilter, listings, query])
  const paginatedListings = useMemo(
    () => filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredListings, page],
  )

  const stats = useMemo(
    () => ({
      pendingListings: listings.filter((listing) => listing.status === 'pending_review').length,
      publishedQuestions: (questionsQuery.data ?? []).filter((question) => question.status === 'published').length,
      totalAdmins: (profilesQuery.data ?? []).filter((profile) => profile.role === 'admin').length,
      totalUsers: profilesQuery.data?.length ?? 0,
    }),
    [listings, profilesQuery.data, questionsQuery.data],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Fila de anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.pricing}>
                <SlidersHorizontal className="size-4" />
                Precos
              </Link>
            </Button>
          </>
        }
        description="Acompanhe a fila prioritaria do MVP e entre rapido nos modulos de moderacao e operacao."
        eyebrow="Admin / visao geral"
        title="Operacao administrativa"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          description="Itens que exigem decisao editorial imediata."
          label="Anuncios pendentes"
          value={stats.pendingListings}
        />
        <AdminStatCard
          description="Threads atualmente visiveis na area publica."
          label="Perguntas publicadas"
          value={stats.publishedQuestions}
        />
        <AdminStatCard
          description="Perfis com acesso administrativo ativo."
          label="Admins"
          value={stats.totalAdmins}
        />
        <AdminStatCard
          description="Base autenticada do marketplace no momento."
          label="Usuarios"
          value={stats.totalUsers}
        />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setFocusFilter('pending_review')
              setQuery('')
              setPage(1)
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Use esta fila como entrada principal para moderacao e triagem."
        title="Fila prioritaria"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por titulo, categoria ou localidade"
            value={query}
          />
          <Select
            onChange={(event) => {
              setFocusFilter(event.target.value as typeof focusFilter)
              setPage(1)
            }}
            value={focusFilter}
          >
            <option value="pending_review">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="all">Todos</option>
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Anuncio',
            cell: (listing) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.summary || listing.description}</p>
              </div>
            ),
          },
          {
            header: 'Categoria',
            cell: (listing) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">{listing.categoryName ?? 'Sem categoria'}</p>
                <p>{listing.materialName ?? 'Material nao informado'}</p>
              </div>
            ),
          },
          {
            header: 'Localidade',
            cell: (listing) => (
              <span className="text-sm text-muted-foreground">
                {listing.city} - {listing.state}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (listing) => {
              const meta = getListingStatusMeta(listing.status)

              return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
            },
          },
          {
            header: 'Atualizado',
            cell: (listing) => <span className="text-sm text-muted-foreground">{formatListingDate(listing.updatedAt)}</span>,
          },
          {
            header: 'Acoes',
            className: 'w-[210px] text-right',
            cell: (listing) => (
              <AdminRowActions
                actions={[
                  {
                    icon: FileClock,
                    label: 'Moderar',
                    to: paths.admin.listingDetails(listing.id),
                  },
                  ...(listing.slug
                    ? [
                        {
                          icon: Eye,
                          label: 'Publico',
                          to: paths.public.listingDetails(listing.slug),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
        data={paginatedListings}
        emptyDescription="Nenhum anuncio encontrado para os filtros atuais."
        emptyTitle="Fila vazia"
        errorMessage="Nao foi possivel carregar a fila administrativa."
        getRowKey={(listing) => listing.id}
        isError={listingsQuery.isError}
        isLoading={listingsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredListings.length}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          description="Atalho rapido para threads pendentes de moderacao."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.questions}>
              Abrir perguntas
            </Link>
          }
          label="Moderacao de perguntas"
          value={<MessageSquare className="size-6" />}
        />
        <AdminStatCard
          description="Estado geral de controle e governanca da operacao."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.settings}>
              Ver configuracoes
            </Link>
          }
          label="Governanca"
          value={<ShieldCheck className="size-6" />}
        />
        <AdminStatCard
          description="Catalogo interno pronto para ajustes e moderacao."
          helper={
            <Link className="text-primary hover:underline" to={paths.admin.listings}>
              Ir para anuncios
            </Link>
          }
          label="Moderacao ativa"
          value={<FileClock className="size-6" />}
        />
      </div>
    </section>
  )
}
