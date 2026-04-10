import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminResetUserPasswordDialog } from '@/components/admin/admin-reset-user-password-dialog'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { AdminUserForm } from '@/components/admin/admin-user-form'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminProfileStats,
  fetchAdminProfilesPage,
  resetAdminUserPassword,
  updateAdminUser,
} from '@/domains/profiles/api'
import type {
  AdminCreateUserValues,
  AdminResetUserPasswordValues,
  AdminUpdateUserValues,
} from '@/domains/profiles/schemas'
import type { AdminProfileSummary } from '@/domains/profiles/types'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

const PAGE_SIZE = 12

function getRoleMeta(role: 'admin' | 'user') {
  return role === 'admin'
    ? { label: 'Administrador', tone: 'info' as const }
    : { label: 'Usuário', tone: 'neutral' as const }
}

function getProfileStatusMeta(status: 'active' | 'suspended' | 'under_review') {
  switch (status) {
    case 'active':
      return { label: 'Ativo', tone: 'success' as const }
    case 'under_review':
      return { label: 'Em análise', tone: 'warning' as const }
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
  const queryClient = useQueryClient()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [editingProfile, setEditingProfile] = useState<AdminProfileSummary | null>(null)
  const [profilePendingRemoval, setProfilePendingRemoval] = useState<AdminProfileSummary | null>(null)
  const [profilePendingPasswordReset, setProfilePendingPasswordReset] =
    useState<AdminProfileSummary | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'admin' | 'all' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'suspended' | 'under_review'>('all')
  const [page, setPage] = useState(1)

  const profilesQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['profiles', 'admin', { page, query, roleFilter, statusFilter }],
    queryFn: () =>
      fetchAdminProfilesPage({
        page,
        pageSize: PAGE_SIZE,
        query,
        role: roleFilter,
        status: statusFilter,
      }),
  })

  const statsQuery = useQuery({
    queryKey: ['profiles', 'admin', 'stats'],
    queryFn: fetchAdminProfileStats,
  })

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível criar o usuário.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Usuário criado com sucesso.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin', 'stats'] }),
      ])
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateAdminUser,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível atualizar o usuário.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Usuário atualizado com sucesso.')
      setEditingProfile(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin', 'stats'] }),
      ])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível excluir o usuário.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Usuário excluído com sucesso.')
      setEditingProfile(null)
      setProfilePendingRemoval(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin', 'stats'] }),
      ])
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetAdminUserPassword,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível redefinir a senha deste usuário.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Senha redefinida com sucesso.')
      setProfilePendingPasswordReset(null)
      await queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] })
    },
  })

  const profiles = profilesQuery.data?.items ?? []
  const totalCount = profilesQuery.data?.totalCount ?? 0
  const stats = statsQuery.data ?? {
    admins: 0,
    suspended: 0,
    total: 0,
    underReview: 0,
  }

  const createDefaults = useMemo<AdminCreateUserValues>(
    () => ({
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
      phone: '',
      role: 'user',
      status: 'active',
    }),
    [],
  )

  const editDefaults = useMemo<AdminUpdateUserValues>(
    () => ({
      email: editingProfile?.email ?? '',
      fullName: editingProfile?.fullName ?? '',
      phone: editingProfile?.phone ?? '',
      role: editingProfile?.role ?? 'user',
      status: editingProfile?.status ?? 'active',
    }),
    [editingProfile],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              onClick={() => {
                clearFeedback()
                setEditingProfile(null)
              }}
              type="button"
            >
              Novo usuário
            </Button>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anúncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.questions}>Perguntas</Link>
            </Button>
          </>
        }
        description="Base autenticada do marketplace, com foco em papel, status e atividade operacional."
        eyebrow="Admin / usuários"
        title="Gestão de usuários"
      />

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Admins" value={stats.admins} />
        <AdminStatCard label="Em análise" value={stats.underReview} />
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
            placeholder="Buscar por nome, e-mail ou telefone"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setRoleFilter(event.target.value as typeof roleFilter)
            }}
            value={roleFilter}
          >
            <option value="all">Todos os papéis</option>
            <option value="user">Usuários</option>
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
            <option value="under_review">Em análise</option>
            <option value="suspended">Suspensos</option>
          </Select>
        </div>
      </AdminFilterCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminUserForm
          defaultValues={createDefaults}
          isPending={createMutation.isPending}
          mode="create"
          onSubmit={(values) => {
            clearFeedback()
            createMutation.mutate({
              email: values.email,
              fullName: values.fullName,
              password: values.password,
              phone: values.phone,
              role: values.role,
              status: values.status,
            })
          }}
          submitLabel="Criar usuário"
        />

        <AdminUserForm
          defaultValues={editDefaults}
          isPending={updateMutation.isPending || deleteMutation.isPending || resetPasswordMutation.isPending}
          mode="edit"
          onCancel={() => setEditingProfile(null)}
          onSubmit={(values) => {
            if (!editingProfile) {
              return
            }

            clearFeedback()
            updateMutation.mutate({
              email: values.email,
              fullName: values.fullName,
              phone: values.phone,
              profileId: editingProfile.id,
              role: values.role,
              status: values.status,
            })
          }}
          submitDisabled={!editingProfile}
          submitLabel={editingProfile ? 'Salvar ajustes' : 'Selecione um usuário'}
        />
      </div>

      <AdminDataTable
        columns={[
          {
            header: 'Usuário',
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
                <p>{profile.email ?? 'Sem e-mail'}</p>
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
                <p>{profile.totalListings} anúncios</p>
                <p>{profile.authoredQuestions} perguntas</p>
                <p>{profile.approvedListings} aprovados</p>
              </div>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[240px] text-right',
            cell: (profile) => (
              <AdminRowActions
                actions={[
                  {
                    label: 'Editar',
                    onClick: () => {
                      clearFeedback()
                      setEditingProfile(profile)
                    },
                  },
                  {
                    icon: KeyRound,
                    label: 'Senha',
                    onClick: () => setProfilePendingPasswordReset(profile),
                    variant: 'outline',
                  },
                  {
                    disabled: deleteMutation.isPending,
                    icon: Trash2,
                    label: 'Excluir',
                    onClick: () => setProfilePendingRemoval(profile),
                    variant: 'destructive',
                  },
                ]}
              />
            ),
          },
        ]}
        data={profiles}
        emptyDescription="Nenhum perfil corresponde ao recorte atual."
        emptyTitle="Sem usuários no filtro"
        errorMessage="Não foi possível carregar os usuários administrativos."
        getRowKey={(profile) => profile.id}
        isError={profilesQuery.isError || statsQuery.isError}
        isLoading={profilesQuery.isLoading || statsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <ConfirmActionDialog
        confirmLabel="Excluir usuário"
        description={
          profilePendingRemoval
            ? `Excluir o usuário ${profilePendingRemoval.fullName}? A ação só será concluída se não houver dados vinculados.`
            : ''
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (profilePendingRemoval) {
            clearFeedback()
            deleteMutation.mutate(profilePendingRemoval.id)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setProfilePendingRemoval(null)
          }
        }}
        open={Boolean(profilePendingRemoval)}
        title="Confirmar exclusão"
        tone="danger"
      />

      <AdminResetUserPasswordDialog
        isPending={resetPasswordMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setProfilePendingPasswordReset(null)
          }
        }}
        onSubmit={(values: AdminResetUserPasswordValues) => {
          if (!profilePendingPasswordReset) {
            return
          }

          clearFeedback()
          resetPasswordMutation.mutate({
            password: values.password,
            profileId: profilePendingPasswordReset.id,
          })
        }}
        open={Boolean(profilePendingPasswordReset)}
        userLabel={profilePendingPasswordReset?.fullName ?? 'usuário'}
      />
    </section>
  )
}
