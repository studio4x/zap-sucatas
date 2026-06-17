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
import { requestPasswordReset, sendWelcomeLink } from '@/domains/auth/api'
import { useAuth } from '@/hooks/use-auth'
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
type BulkEmailActionKind = 'password_reset' | 'welcome'

function getBulkEmailActionMeta(kind: BulkEmailActionKind) {
  if (kind === 'password_reset') {
    return {
      buttonLabel: 'Enviar redefinição',
      confirmLabel: 'Enviar redefinição',
      description:
        'Será enviado um e-mail de redefinição de senha para os usuários selecionados que tiverem e-mail cadastrado.',
      title: 'Confirmar redefinição em massa',
    }
  }

  return {
    buttonLabel: 'Enviar boas-vindas',
    confirmLabel: 'Enviar boas-vindas',
    description:
      'Será enviado um e-mail de boas-vindas com link de acesso para os usuários selecionados que tiverem e-mail cadastrado.',
    title: 'Confirmar envio de boas-vindas',
  }
}

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
  const [bulkEmailAction, setBulkEmailAction] = useState<BulkEmailActionKind | null>(null)
  const [selectedProfileSnapshots, setSelectedProfileSnapshots] = useState<Record<string, AdminProfileSummary>>({})
  const [selectionRangeStart, setSelectionRangeStart] = useState(1)
  const [selectionRangeEnd, setSelectionRangeEnd] = useState(1)
  const [selectionOperation, setSelectionOperation] = useState<'filtered' | 'range' | null>(null)
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

  const welcomeEmailMutation = useMutation({
    mutationFn: sendWelcomeLink,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível enviar o e-mail de boas-vindas.')
    },
    onSuccess: async (_data, email) => {
      setSuccessFeedback(`E-mail de boas-vindas enviado para ${email}.`)
      await queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] })
    },
  })

  const profiles = profilesQuery.data?.items ?? []
  const totalCount = profilesQuery.data?.totalCount ?? 0
  const currentProfileId = user?.profileId ?? null
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => profile.id !== currentProfileId),
    [currentProfileId, profiles],
  )

  const selectableProfileIds = useMemo(
    () => selectableProfiles.map((profile) => profile.id),
    [selectableProfiles],
  )

  const selectedProfiles = useMemo(
    () => Object.values(selectedProfileSnapshots),
    [selectedProfileSnapshots],
  )

  const selectedProfileIds = useMemo(
    () => selectedProfiles.map((profile) => profile.id),
    [selectedProfiles],
  )

  const selectedProfileIdSet = useMemo(
    () => new Set(selectedProfileIds),
    [selectedProfileIds],
  )

  const selectedAdminCount = useMemo(
    () => selectedProfiles.filter((profile) => profile.role === 'admin').length,
    [selectedProfiles],
  )

  const selectedUserCount = selectedProfiles.length - selectedAdminCount

  const allSelectableSelected =
    selectableProfileIds.length > 0 &&
    selectableProfileIds.every((profileId) => selectedProfileIdSet.has(profileId))
  const someSelectableSelected = selectableProfileIds.some((profileId) =>
    selectedProfileIdSet.has(profileId),
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
    if (!currentProfileId) {
      return
    }

    setSelectedProfileSnapshots((current) => {
      if (!current[currentProfileId]) {
        return current
      }

      const next = { ...current }
      delete next[currentProfileId]
      return next
    })
  }, [currentProfileId])

  useEffect(() => {
    const nextStart = Math.min(Math.max(selectionRangeStart, 1), totalPages)
    const nextEnd = Math.min(Math.max(selectionRangeEnd, 1), totalPages)

    if (nextStart !== selectionRangeStart) {
      setSelectionRangeStart(nextStart)
    }

    if (nextEnd !== selectionRangeEnd) {
      setSelectionRangeEnd(nextEnd)
    }
  }, [selectionRangeEnd, selectionRangeStart, totalPages])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    selectAllRef.current.indeterminate = someSelectableSelected && !allSelectableSelected
  }, [allSelectableSelected, someSelectableSelected])

  const bulkDeleteMutation = useMutation({
    mutationFn: async (profileIds: string[]) => {
      const deletedProfiles: AdminProfileSummary[] = []
      const failedProfiles: Array<{ message: string; profile: AdminProfileSummary | null }> = []

      for (const profileId of profileIds) {
        const profile = selectedProfileSnapshots[profileId] ?? profiles.find((item) => item.id === profileId) ?? null

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
      setSelectedProfileSnapshots({})

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

  const bulkEmailMutation = useMutation({
    mutationFn: async ({
      kind,
      profileIds,
    }: {
      kind: BulkEmailActionKind
      profileIds: string[]
    }) => {
      const sentProfiles: AdminProfileSummary[] = []
      const skippedProfiles: AdminProfileSummary[] = []
      const failedProfiles: Array<{ message: string; profile: AdminProfileSummary | null }> = []

      for (const profileId of profileIds) {
        const profile =
          selectedProfileSnapshots[profileId] ?? profiles.find((item) => item.id === profileId) ?? null

        if (!profile?.email) {
          if (profile) {
            skippedProfiles.push(profile)
          }

          continue
        }

        try {
          if (kind === 'password_reset') {
            await requestPasswordReset(profile.email)
          } else {
            await sendWelcomeLink(profile.email)
          }

          sentProfiles.push(profile)
        } catch (error) {
          failedProfiles.push({
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : 'Não foi possível enviar o e-mail.',
            profile,
          })
        }
      }

      return {
        failedProfiles,
        kind,
        sentProfiles,
        skippedProfiles,
      }
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível enviar os e-mails em massa.')
    },
    onSuccess: async ({ failedProfiles, kind, sentProfiles, skippedProfiles }) => {
      setBulkEmailAction(null)

      const actionLabel = kind === 'password_reset' ? 'Redefinição' : 'Boas-vindas'

      if (sentProfiles.length === 0 && skippedProfiles.length > 0 && failedProfiles.length === 0) {
        setWarningFeedback(
          `Nenhum usuário selecionado possui e-mail cadastrado. ${actionLabel} não enviada.`,
        )
        setSelectedProfileSnapshots({})
      } else if (failedProfiles.length > 0) {
        setWarningFeedback(
          `${actionLabel} enviada para ${sentProfiles.length} usuário(s). ${skippedProfiles.length} sem e-mail ignorado(s). ${failedProfiles.length} falha(s) no envio em massa.`,
        )
      } else if (skippedProfiles.length > 0) {
        setWarningFeedback(
          `${actionLabel} enviada para ${sentProfiles.length} usuário(s). ${skippedProfiles.length} sem e-mail foram ignorado(s).`,
        )
        setSelectedProfileSnapshots({})
      } else {
        setSuccessFeedback(`${actionLabel} enviada para ${sentProfiles.length} usuário(s) com sucesso.`)
        setSelectedProfileSnapshots({})
      }

      await queryClient.invalidateQueries({ queryKey: ['profiles', 'admin'] })
    },
  })

  function replaceSelectedProfiles(profilesToSelect: AdminProfileSummary[]) {
    setSelectedProfileSnapshots(
      Object.fromEntries(
        profilesToSelect
          .filter((profile) => profile.id !== currentProfileId)
          .map((profile) => [profile.id, profile] as const),
      ),
    )
  }

  function toggleProfileSelection(profileId: string, checked: boolean) {
    if (profileId === currentProfileId) {
      return
    }

    setSelectedProfileSnapshots((current) => {
      const next = { ...current }

      if (checked) {
        const profile = profiles.find((item) => item.id === profileId) ?? current[profileId]
        if (profile) {
          next[profileId] = profile
        }
      } else {
        delete next[profileId]
      }

      return next
    })
  }

  function toggleAllProfiles(checked: boolean) {
    if (checked) {
      replaceSelectedProfiles(selectableProfiles)
      return
    }

    setSelectedProfileSnapshots({})
  }

  async function fetchProfilesForPages(pageNumbers: number[]) {
    const uniquePages = Array.from(new Set(pageNumbers.filter((value) => Number.isFinite(value)))).sort(
      (left, right) => left - right,
    )

    const responses = await Promise.all(
      uniquePages.map((targetPage) =>
        fetchAdminProfilesPage({
          page: targetPage,
          pageSize: PAGE_SIZE,
          query,
          role: roleFilter,
          status: statusFilter,
        }),
      ),
    )

    return responses.flatMap((response) => response.items)
  }

  async function handleSelectFilteredUsers() {
    if (totalCount === 0) {
      setWarningFeedback('Nenhum usuário encontrado para seleção filtrada.')
      return
    }

    setSelectionOperation('filtered')
    clearFeedback()

    try {
      const pages = Array.from({ length: totalPages }, (_value, index) => index + 1)
      const filteredProfiles = await fetchProfilesForPages(pages)
      replaceSelectedProfiles(filteredProfiles)
      setSuccessFeedback(`${filteredProfiles.length} usuário(s) filtrado(s) selecionado(s).`)
    } catch (error) {
      setErrorFeedback(error, 'Não foi possível selecionar os usuários filtrados.')
    } finally {
      setSelectionOperation(null)
    }
  }

  async function handleSelectPageRange() {
    const start = Math.min(Math.max(Math.trunc(selectionRangeStart), 1), totalPages)
    const end = Math.min(Math.max(Math.trunc(selectionRangeEnd), 1), totalPages)
    const normalizedStart = Math.min(start, end)
    const normalizedEnd = Math.max(start, end)

    if (totalCount === 0) {
      setWarningFeedback('Nenhum usuário encontrado para seleção por faixa.')
      return
    }

    setSelectionOperation('range')
    clearFeedback()

    try {
      const pages = Array.from(
        { length: normalizedEnd - normalizedStart + 1 },
        (_value, index) => normalizedStart + index,
      )
      const rangeProfiles = await fetchProfilesForPages(pages)
      replaceSelectedProfiles(rangeProfiles)
      setSelectionRangeStart(normalizedStart)
      setSelectionRangeEnd(normalizedEnd)
      setSuccessFeedback(
        `${rangeProfiles.length} usuário(s) selecionado(s) da faixa de páginas ${normalizedStart}-${normalizedEnd}.`,
      )
    } catch (error) {
      setErrorFeedback(error, 'Não foi possível selecionar a faixa de páginas.')
    } finally {
      setSelectionOperation(null)
    }
  }

  function clearSelectedProfiles() {
    setSelectedProfileSnapshots({})
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

      <div className="space-y-4 rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Seleção em lote</p>
            <p className="text-xs text-muted-foreground">
              A seleção manual vale para a página atual. Os atalhos abaixo substituem a seleção atual com
              usuários filtrados ou com uma faixa de páginas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={selectionOperation !== null || totalCount === 0}
              onClick={() => {
                void handleSelectFilteredUsers()
              }}
              type="button"
              variant="outline"
            >
              {selectionOperation === 'filtered' ? 'Selecionando...' : 'Selecionar usuários filtrados'}
            </Button>
            <Button
              disabled={selectedProfileIds.length === 0 || bulkDeleteMutation.isPending}
              onClick={() => {
                clearFeedback()
                setBulkDeleteDialogOpen(true)
              }}
              type="button"
              variant="destructive"
            >
              Excluir selecionados
            </Button>
            <Button
              disabled={selectedProfileIds.length === 0 || bulkEmailMutation.isPending}
              onClick={() => {
                clearFeedback()
                setBulkEmailAction('password_reset')
              }}
              type="button"
              variant="outline"
            >
              Enviar redefinição
            </Button>
            <Button
              disabled={selectedProfileIds.length === 0 || bulkEmailMutation.isPending}
              onClick={() => {
                clearFeedback()
                setBulkEmailAction('welcome')
              }}
              type="button"
              variant="outline"
            >
              Enviar boas-vindas
            </Button>
            <Button
              disabled={selectedProfileIds.length === 0}
              onClick={clearSelectedProfiles}
              type="button"
              variant="outline"
            >
              Limpar seleção
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,160px)_minmax(0,160px)_auto]">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Página inicial
            </label>
            <Input
              disabled={selectionOperation !== null || totalCount === 0}
              max={totalPages}
              min={1}
              onChange={(event) => {
                const value = Number(event.target.value)
                setSelectionRangeStart(Number.isFinite(value) ? value : 1)
              }}
              type="number"
              value={selectionRangeStart}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Página final
            </label>
            <Input
              disabled={selectionOperation !== null || totalCount === 0}
              max={totalPages}
              min={1}
              onChange={(event) => {
                const value = Number(event.target.value)
                setSelectionRangeEnd(Number.isFinite(value) ? value : 1)
              }}
              type="number"
              value={selectionRangeEnd}
            />
          </div>
          <div className="flex items-end">
            <Button
              disabled={selectionOperation !== null || totalCount === 0}
              onClick={() => {
                void handleSelectPageRange()
              }}
              type="button"
              variant="outline"
            >
              {selectionOperation === 'range' ? 'Selecionando faixa...' : 'Selecionar faixa'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{selectedProfiles.length} selecionados</span>
          <span>{selectedAdminCount} admins</span>
          <span>{selectedUserCount} usuários</span>
          <span>{totalCount} no filtro atual</span>
          <span>Páginas 1-{totalPages}</span>
        </div>
      </div>

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
              const isSelected = selectedProfileIdSet.has(profile.id)

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
                    label: 'Enviar redefinição',
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
                    disabled: !profile.email || welcomeEmailMutation.isPending,
                    icon: Mail,
                    label: 'Enviar boas-vindas',
                    onClick: () => {
                      if (!profile.email) {
                        setErrorFeedback(
                          new Error('Usuário sem e-mail cadastrado.'),
                          'Não foi possível enviar o e-mail de boas-vindas.',
                        )
                        return
                      }

                      clearFeedback()
                      welcomeEmailMutation.mutate(profile.email)
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
          selectedProfileIdSet.has(profile.id) ? 'bg-emerald-50/70 hover:bg-emerald-50' : undefined
        }
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <ConfirmActionDialog
        confirmLabel={bulkEmailAction ? getBulkEmailActionMeta(bulkEmailAction).confirmLabel : 'Confirmar'}
        description={
          bulkEmailAction
            ? `${getBulkEmailActionMeta(bulkEmailAction).description} ${selectedProfiles.length} usuário(s) estão selecionados.`
            : ''
        }
        isPending={bulkEmailMutation.isPending}
        onConfirm={() => {
          if (bulkEmailAction && selectedProfiles.length > 0) {
            clearFeedback()
            bulkEmailMutation.mutate({
              kind: bulkEmailAction,
              profileIds: selectedProfiles.map((profile) => profile.id),
            })
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setBulkEmailAction(null)
          }
        }}
        open={bulkEmailAction !== null}
        title={bulkEmailAction ? getBulkEmailActionMeta(bulkEmailAction).title : 'Confirmar ação'}
        tone="default"
      />

      <ConfirmActionDialog
        confirmLabel={bulkDeleteDialogOpen ? 'Excluir selecionados' : 'Excluir usuário'}
        description={
          bulkDeleteDialogOpen
            ? `Excluir ${selectedProfiles.length} usuário(s) selecionado(s)? ${selectedAdminCount} admin(s) e ${selectedUserCount} usuário(s) serão removidos se não houver dados vinculados.`
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
