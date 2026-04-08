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
import { fetchAdminProfiles } from '@/domains/profiles/api'

const PAGE_SIZE = 12

function getRoleMeta(role: 'admin' | 'user') {
  return role === 'admin'
    ? { label: 'Administrador', tone: 'info' as const }
    : { label: 'Usuario', tone: 'neutral' as const }
}

function getProfileStatusMeta(status: 'active' | 'suspended' | 'under_review') {
  switch (status) {
    case 'active':
      return { label: 'Ativo', tone: 'success' as const }
    case 'under_review':
      return { label: 'Em analise', tone: 'warning' as const }
    default:
      return { label: 'Suspenso', tone: 'danger' as const }
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'admin' | 'all' | 'user'>('all')
  const [statusFilter, setStatusFilter] =
    useState<'active' | 'all' | 'suspended' | 'under_review'>('all')
  const [page, setPage] = useState(1)

  const profilesQuery = useQuery({
    queryKey: ['profiles', 'admin'],
    queryFn: fetchAdminProfiles,
  })

  const profiles = profilesQuery.data ?? []
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return profiles.filter((profile) => {
      const matchesRole = roleFilter === 'all' ? true : profile.role === roleFilter
      const matchesStatus = statusFilter === 'all' ? true : profile.status === statusFilter
      const haystack = `${profile.fullName} ${profile.phone ?? ''} ${profile.authUserId}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesRole && matchesStatus && matchesQuery
    })
  }, [page, profiles, query, roleFilter, statusFilter])
  const paginatedProfiles = useMemo(
    () => filteredProfiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProfiles, page],
  )

  const stats = useMemo(
    () => ({
      admins: profiles.filter((profile) => profile.role === 'admin').length,
      underReview: profiles.filter((profile) => profile.status === 'under_review').length,
      suspended: profiles.filter((profile) => profile.status === 'suspended').length,
      total: profiles.length,
    }),
    [profiles],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.questions}>Perguntas</Link>
            </Button>
          </>
        }
        description="Base autenticada do marketplace, com foco em papel, status e atividade operacional."
        eyebrow="Admin / usuarios"
        title="Gestao de usuarios"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Admins" value={stats.admins} />
        <AdminStatCard label="Em analise" value={stats.underReview} />
        <AdminStatCard label="Suspensos" value={stats.suspended} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setRoleFilter('all')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtre a base antes de inspecionar atividade por perfil."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por nome, telefone ou auth id"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setRoleFilter(event.target.value as typeof roleFilter)
            }}
            value={roleFilter}
          >
            <option value="all">Todos os papeis</option>
            <option value="user">Usuarios</option>
            <option value="admin">Admins</option>
          </Select>
          <Select
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as typeof statusFilter)
            }}
            value={statusFilter}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="under_review">Em analise</option>
            <option value="suspended">Suspensos</option>
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Usuario',
            cell: (profile) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{profile.fullName}</p>
                <p className="text-xs text-muted-foreground">Criado em {formatDate(profile.createdAt)}</p>
              </div>
            ),
          },
          {
            header: 'Contato',
            cell: (profile) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{profile.phone ?? 'Sem telefone'}</p>
                <p>auth: {profile.authUserId.slice(0, 8)}...</p>
              </div>
            ),
          },
          {
            header: 'Papel',
            cell: (profile) => (
              <AdminStatusBadge tone={getRoleMeta(profile.role).tone}>
                {getRoleMeta(profile.role).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Status',
            cell: (profile) => (
              <AdminStatusBadge tone={getProfileStatusMeta(profile.status).tone}>
                {getProfileStatusMeta(profile.status).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Atividade',
            cell: (profile) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{profile.totalListings} anuncios</p>
                <p>{profile.authoredQuestions} perguntas</p>
                <p>{profile.approvedListings} aprovados</p>
              </div>
            ),
          },
        ]}
        data={paginatedProfiles}
        emptyDescription="Nenhum perfil corresponde ao recorte atual."
        emptyTitle="Sem usuarios no filtro"
        errorMessage="Nao foi possivel carregar os usuarios administrativos."
        getRowKey={(profile) => profile.id}
        isError={profilesQuery.isError}
        isLoading={profilesQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredProfiles.length}
      />
    </section>
  )
}
