import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, PencilLine, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { AdminUserFormModal } from '@/components/admin/admin-user-form-modal'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { requestPasswordReset } from '@/domains/auth/api'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminProfileStats,
  fetchAdminProfilesPage,
  updateAdminUser,
} from '@/domains/profiles/api'
import type { AdminCreateUserValues, AdminUpdateUserValues } from '@/domains/profiles/schemas'
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
  const { user } = useAuth()
  const {
    clearFeedback,
    feedback,
    setErrorFeedback,
    setSuccessFeedback,
    setWarningFeedback,
  } = useOperationFeedback()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AdminProfileSummary | null>(null)
  const [profilePendingRemoval, setProfilePendingRemoval] = useState<AdminProfileSummary | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'admin' | 'all' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'suspended' | 'under_review'>('all')
  const [page, setPage] = useState(1)
  const selectAllRef = useRef<HTMLInputElement | null>(null)

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
      setCreateDialogOpen(false)
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

  const resetPasswordEmailMutation = useMutation({
    mutationFn: requestPasswordReset,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível enviar o e-mail de redefinição.')
    },
    onSuccess: async (_data, email) => {
      setSuccessFeedback(`E-mail de redefinição enviado para ${email}.`)
      await queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] })
    },
  })

  const profiles = profilesQuery.data?.items ?? []
  const totalCount = profilesQuery.data?.totalCount ?? 0
  const currentProfileId = user?.profileId ?? null

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => profile.id !== currentProfileId),
    [currentProfileId, profiles],
  )

  const selectableProfileIds = useMemo(
    () => selectableProfiles.map((profile) => profile.id),
    [selectableProfiles],
  )

  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selectedProfileIds.includes(profile.id)),
    [profiles, selectedProfileIds],
  )

  const allSelectableSelected =
    selectableProfileIds.length > 0 &&
    selectableProfileIds.every((profileId) => selectedProfileIds.includes(profileId))
  const someSelectableSelected = selectableProfileIds.some((profileId) =>
    selectedProfileIds.includes(profileId),
  )

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

  useEffect(() => {
    setSelectedProfileIds((current) =>
      current.filter(
        (profileId) =>
          profiles.some((profile) => profile.id === profileId && profile.id !== currentProfileId),
      ),
    )
  }, [currentProfileId, profiles])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    selectAllRef.current.indeterminate = someSelectableSelected && !allSelectableSelected
  }, [allSelectableSelected, someSelectableSelected])

  const bulkDeleteMutation = useMutation({
    mutationFn: async (profileIds: string[]) => {
      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
      const deletedProfiles: AdminProfileSummary[] = []
      const failedProfiles: Array<{ message: string; profile: AdminProfileSummary | null }> = []

      for (const profileId of profileIds) {
        const profile = profileMap.get(profileId) ?? null

        try {
          await deleteAdminUser(profileId)
          if (profile) {
            deletedProfiles.push(profile)
          }
        } catch (error) {
          failedProfiles.push({
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : 'Não foi possível excluir o usuário.',
            profile,
          })
        }
      }

      return {
        deletedProfiles,
        failedProfiles,
      }
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível excluir os usuários selecionados.')
    },
    onSuccess: async ({ deletedProfiles, failedProfiles }) => {
      setBulkDeleteDialogOpen(false)
      setProfilePendingRemoval(null)
      setSelectedProfileIds([])

      if (failedProfiles.length > 0) {
        setWarningFeedback(
          `${deletedProfiles.length} usuário(s) excluído(s). ${failedProfiles.length} falha(s) na exclusão em massa.`,
        )
      } else {
        setSuccessFeedback(`${deletedProfiles.length} usuário(s) excluído(s) com sucesso.`)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles', 'admin', 'stats'] }),
      ])
    },
  })

  function toggleProfileSelection(profileId: string, checked: boolean) {
    if (profileId === currentProfileId) {
      return
    }

    setSelectedProfileIds((current) =>
      checked
        ? Array.from(new Set([...current, profileId]))
        : current.filter((currentProfileIdItem) => currentProfileIdItem !== profileId),
    )
  }

  function toggleAllProfiles(checked: boolean) {
    setSelectedProfileIds(checked ? selectableProfileIds : [])
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              onClick={() => {
                clearFeedback()
                setEditingProfile(null)
                setCreateDialogOpen(true)
              }}
              type="button"
            >
              Adicionar novo usuário
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
        eyebrow="Administração / usuários"
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

      {selectedProfiles.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {selectedProfiles.length} usuário(s) selecionado(s)
            </p>
            <p className="text-xs text-muted-foreground">
              A seleção vale apenas para a página atual e ignora sua própria conta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setSelectedProfileIds([])} type="button" variant="outline">
              Limpar seleção
            </Button>
            <Button
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                clearFeedback()
                setBulkDeleteDialogOpen(true)
              }}
              type="button"
              variant="destructive"
            >
              Excluir selecionados
            </Button>
          </div>
        </div>
      ) : null}

      <AdminDataTable
        columns={[
          {
            header: (
              <div className="flex items-center justify-center">
                <input
                  aria-label="Selecionar todos os usuários da página"
                  checked={allSelectableSelected}
                  className="size-4 rounded border-border accent-[#27991f]"
                  disabled={selectableProfileIds.length === 0}
                  onChange={(event) => {
                    toggleAllProfiles(event.target.checked)
                  }}
                  ref={selectAllRef}
                  type="checkbox"
                />
              </div>
            ),
            className: 'w-12 text-center',
            id: 'selection',
            cell: (profile) => {
              const isCurrentUser = profile.id === currentProfileId
              const isSelected = selectedProfileIds.includes(profile.id)

              return (
                <div className="flex items-center justify-center">
                  <input
                    aria-label={`Selecionar ${profile.fullName}`}
                    checked={isSelected}
                    className="size-4 rounded border-border accent-[#27991f]"
                    disabled={isCurrentUser}
                    onChange={(event) => {
                      toggleProfileSelection(profile.id, event.target.checked)
                    }}
                    title={
                      isCurrentUser
                        ? 'Não é possível excluir sua própria conta.'
                        : 'Selecionar usuário para exclusão'
                    }
                    type="checkbox"
                  />
                </div>
              )
            },
          },
          {
            header: 'Usuário',
            id: 'user',
            cell: (profile) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{profile.fullName}</p>
                <p className="text-xs text-muted-foreground">Criado em {formatDate(profile.createdAt)}</p>
              </div>
            ),
          },
          {
            header: 'Contato',
            id: 'contact',
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
            id: 'role',
            cell: (profile) => (
              <AdminStatusBadge tone={getRoleMeta(profile.role).tone}>
                {getRoleMeta(profile.role).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Status',
            id: 'status',
            cell: (profile) => (
              <AdminStatusBadge tone={getProfileStatusMeta(profile.status).tone}>
                {getProfileStatusMeta(profile.status).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Atividade',
            id: 'activity',
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
            id: 'actions',
            cell: (profile) => (
              <AdminRowActions
                compact
                actions={[
                  {
                    icon: PencilLine,
                    label: 'Editar',
                    onClick: () => {
                      clearFeedback()
                      setCreateDialogOpen(false)
                      setEditingProfile(profile)
                    },
                  },
                  {
                    disabled: !profile.email || resetPasswordEmailMutation.isPending,
                    icon: Mail,
                    label: 'Redefinir e-mail',
                    onClick: () => {
                      if (!profile.email) {
                        setErrorFeedback(
                          new Error('Usuário sem e-mail cadastrado.'),
                          'Não foi possível enviar o e-mail de redefinição.',
                        )
                        return
                      }

                      clearFeedback()
                      resetPasswordEmailMutation.mutate(profile.email)
                    },
                    variant: 'outline',
                  },
                  {
                    icon: Trash2,
                    disabled: deleteMutation.isPending,
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
        minWidth="min-w-[1060px]"
        rowClassName={(profile) =>
          selectedProfileIds.includes(profile.id) ? 'bg-emerald-50/70 hover:bg-emerald-50' : undefined
        }
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <ConfirmActionDialog
        confirmLabel={bulkDeleteDialogOpen ? 'Excluir selecionados' : 'Excluir usuário'}
        description={
          bulkDeleteDialogOpen
            ? `Excluir ${selectedProfiles.length} usuário(s) selecionado(s)? A ação só será concluída se não houver dados vinculados.`
            : profilePendingRemoval
              ? `Excluir o usuário ${profilePendingRemoval.fullName}? A ação só será concluída se não houver dados vinculados.`
              : ''
        }
        isPending={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onConfirm={() => {
          if (bulkDeleteDialogOpen && selectedProfiles.length > 0) {
            clearFeedback()
            bulkDeleteMutation.mutate(selectedProfiles.map((profile) => profile.id))
            return
          }

          if (profilePendingRemoval) {
            clearFeedback()
            deleteMutation.mutate(profilePendingRemoval.id)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setProfilePendingRemoval(null)
            setBulkDeleteDialogOpen(false)
          }
        }}
        open={Boolean(profilePendingRemoval) || bulkDeleteDialogOpen}
        title={bulkDeleteDialogOpen ? 'Confirmar exclusão em massa' : 'Confirmar exclusão'}
        tone="danger"
      />

      <AdminUserFormModal
        defaultValues={createDefaults}
        isPending={createMutation.isPending}
        mode="create"
        onOpenChange={setCreateDialogOpen}
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
        open={createDialogOpen}
        submitLabel="Criar usuário"
      />

      <AdminUserFormModal
        defaultValues={editDefaults}
        isPending={updateMutation.isPending || deleteMutation.isPending}
        mode="edit"
        onOpenChange={(open) => {
          if (!open) {
            setEditingProfile(null)
          }
        }}
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
        open={Boolean(editingProfile)}
        submitDisabled={!editingProfile}
        submitLabel={editingProfile ? 'Salvar ajustes' : 'Selecione um usuário'}
      />
    </section>
  )
}
