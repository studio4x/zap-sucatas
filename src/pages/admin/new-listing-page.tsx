import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { AdminUserForm } from '@/components/admin/admin-user-form'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  approveListing,
  createListingDraft,
  fetchBrazilLocalities,
  fetchListingReferences,
  reorderListingImages,
  uploadListingImages,
} from '@/domains/listings/api'
import { createAdminUser, fetchAdminProfiles } from '@/domains/profiles/api'
import { createEmptyListingFormValues } from '@/domains/listings/utils'
import { fetchSystemSettings } from '@/domains/settings/api'
import { useAuth } from '@/hooks/use-auth'
import type { AdminCreateUserValues } from '@/domains/profiles/schemas'
import type { AdminProfileSummary } from '@/domains/profiles/types'

function formatOwnerOption(profile: AdminProfileSummary) {
  const statusLabel =
    profile.status === 'active'
      ? 'Ativo'
      : profile.status === 'under_review'
        ? 'Em análise'
        : 'Suspenso'

  const roleLabel = profile.role === 'admin' ? 'Admin' : 'Usuário'

  return `${profile.fullName} • ${profile.email ?? 'Sem e-mail'} • ${roleLabel} • ${statusLabel}`
}

export function AdminNewListingPage() {
  const queryClient = useQueryClient()
  const { status, user } = useAuth()
  const [selectedOwnerProfileId, setSelectedOwnerProfileId] = useState('')
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [createUserError, setCreateUserError] = useState<string | null>(null)

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })
  const brazilLocalitiesQuery = useQuery({
    queryKey: ['listing-localities', 'brazil'],
    queryFn: fetchBrazilLocalities,
    staleTime: 1000 * 60 * 60 * 24,
  })
  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })
  const ownerProfilesQuery = useQuery({
    queryKey: ['profiles', 'admin', 'listing-owners'],
    queryFn: fetchAdminProfiles,
  })

  const ownerProfiles = useMemo(() => ownerProfilesQuery.data ?? [], [ownerProfilesQuery.data])

  useEffect(() => {
    if (selectedOwnerProfileId) {
      return
    }

    if (status === 'loading') {
      return
    }

    if (user?.profileId) {
      setSelectedOwnerProfileId(user.profileId)
      return
    }

    if (ownerProfiles.length > 0) {
      setSelectedOwnerProfileId(ownerProfiles[0].id)
    }
  }, [ownerProfiles, selectedOwnerProfileId, status, user?.profileId])

  const defaultValues = useMemo(() => {
    const base = createEmptyListingFormValues()

    return {
      ...base,
      contactName: settingsQuery.data?.siteName ?? 'Zap Sucatas',
      contactPhone: settingsQuery.data?.supportPhone ?? '',
    }
  }, [settingsQuery.data?.siteName, settingsQuery.data?.supportPhone])

  const createUserDefaults = useMemo<AdminCreateUserValues>(
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

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onError: (error) => {
      setCreateUserError(error instanceof Error ? error.message : 'Não foi possível criar o usuário.')
    },
    onSuccess: async (result) => {
      setCreateUserError(null)
      await ownerProfilesQuery.refetch()
      setSelectedOwnerProfileId(result.profileId)
      setIsCreateUserModalOpen(false)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ListingEditorSubmitPayload) => {
      if (!user?.profileId) {
        throw new Error('Perfil administrativo não encontrado.')
      }

      const ownerProfileId = selectedOwnerProfileId.trim()

      if (!ownerProfileId) {
        throw new Error('Selecione o usuário dono do anúncio.')
      }

      const listingId = await createListingDraft({
        profileId: ownerProfileId,
        values: payload.values,
      })

      let orderedImageIds: string[] = []
      let coverImageId: string | null = null

      if (payload.newUploads.length > 0) {
        const uploadedImages = await uploadListingImages({
          authUserId: user.id,
          files: payload.newUploads.map((upload) => upload.file),
          listingId,
        })

        const uploadedImageIdsByKey = new Map(
          payload.newUploads.map((upload, index) => [upload.key, uploadedImages[index]?.id ?? null]),
        )

        orderedImageIds = payload.imageOrderKeys
          .map((key) => uploadedImageIdsByKey.get(key) ?? null)
          .filter((value): value is string => Boolean(value))

        coverImageId = payload.coverImageKey
          ? uploadedImageIdsByKey.get(payload.coverImageKey) ?? null
          : null
      }

      if (orderedImageIds.length > 0) {
        await reorderListingImages({
          coverImageId,
          listingId,
          orderedImageIds,
        })
      }

      if (payload.submitAfterSave) {
        await approveListing(listingId)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner', ownerProfileId] }),
      ])

      return payload.submitAfterSave
        ? {
            actionLabel: 'Ir para anúncios',
            description: 'O anúncio foi criado e aprovado com sucesso.',
            redirectTo: paths.admin.listings,
            title: 'Anúncio aprovado',
          }
        : {
            actionLabel: 'Abrir anúncio',
            description: 'O anúncio foi salvo como rascunho e pode ser editado novamente.',
            redirectTo: paths.admin.editListing(listingId),
            title: 'Rascunho criado',
          }
    },
  })

  if (
    referencesQuery.isLoading ||
    settingsQuery.isLoading ||
    brazilLocalitiesQuery.isLoading ||
    ownerProfilesQuery.isLoading
  ) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando referências para o anúncio administrativo...
      </div>
    )
  }

  if (
    referencesQuery.isError ||
    settingsQuery.isError ||
    brazilLocalitiesQuery.isError ||
    ownerProfilesQuery.isError ||
    !referencesQuery.data ||
    !brazilLocalitiesQuery.data ||
    !ownerProfilesQuery.data
  ) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar categorias, materiais, usuários e dados básicos da Zap Sucatas."
        title="Falha ao abrir o formulário"
        tone="error"
      />
    )
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        description="Cadastre um anúncio institucional da Zap Sucatas usando o mesmo fluxo operacional do marketplace."
        eyebrow="Administração / anúncios"
        title="Novo anúncio da Zap Sucatas"
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="admin-listing-owner">
              Usuário dono do anúncio
            </label>
            <Select
              id="admin-listing-owner"
              onChange={(event) => setSelectedOwnerProfileId(event.target.value)}
              value={selectedOwnerProfileId}
            >
              <option value="">Selecione um usuário</option>
              {ownerProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {formatOwnerOption(profile)}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Este perfil será o responsável pelo anúncio e aparecerá no dashboard correspondente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setCreateUserError(null)
                setIsCreateUserModalOpen(true)
              }}
              type="button"
              variant="outline"
            >
              Novo usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      <ListingEditor
        key={`admin-new-listing:${settingsQuery.data?.siteName ?? 'site'}:${settingsQuery.data?.supportPhone ?? 'phone'}`}
        cancelTo={paths.admin.listings}
        categories={referencesQuery.data.categories}
        cityOptionsByState={brazilLocalitiesQuery.data.stateCityMap}
        defaultValues={defaultValues}
        finalActionDescription="Salve o anúncio como rascunho ou publique diretamente no catálogo da Zap Sucatas quando os dados estiverem prontos."
        finalActionLabel="Salvar e publicar agora"
        isSubmitting={createMutation.isPending}
        materials={referencesQuery.data.materials}
        mode="create"
        onSubmit={createMutation.mutateAsync}
        stateOptions={brazilLocalitiesQuery.data.states}
        status="draft"
      />

      {isCreateUserModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
          <button
            aria-label="Fechar criação de usuário"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!createUserMutation.isPending) {
                setIsCreateUserModalOpen(false)
                setCreateUserError(null)
              }
            }}
            type="button"
          />
          <div className="relative w-full max-w-2xl">
            {createUserError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createUserError}
              </div>
            ) : null}
            <AdminUserForm
              defaultValues={createUserDefaults}
              isPending={createUserMutation.isPending}
              mode="create"
              onSubmit={(values) => {
                createUserMutation.mutate({
                  email: values.email,
                  fullName: values.fullName,
                  password: values.password,
                  phone: values.phone,
                  role: values.role,
                  status: values.status,
                })
              }}
              submitLabel="Criar e vincular"
            />
            <div className="mt-4 flex justify-end">
              <Button
                disabled={createUserMutation.isPending}
                onClick={() => {
                  setIsCreateUserModalOpen(false)
                  setCreateUserError(null)
                }}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

