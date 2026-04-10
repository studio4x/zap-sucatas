import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  approveListing,
  createListingDraft,
  fetchListingReferences,
  reorderListingImages,
  uploadListingImages,
} from '@/domains/listings/api'
import { createEmptyListingFormValues } from '@/domains/listings/utils'
import { fetchSystemSettings } from '@/domains/settings/api'
import { useAuth } from '@/hooks/use-auth'

export function AdminNewListingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })
  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const defaultValues = useMemo(() => {
    const base = createEmptyListingFormValues()

    return {
      ...base,
      contactName: settingsQuery.data?.siteName ?? 'Zap Sucatas',
      contactPhone: settingsQuery.data?.supportPhone ?? '',
    }
  }, [settingsQuery.data?.siteName, settingsQuery.data?.supportPhone])

  const createMutation = useMutation({
    mutationFn: async (payload: ListingEditorSubmitPayload) => {
      if (!user?.profileId) {
        throw new Error('Perfil administrativo não encontrado.')
      }

      const listingId = await createListingDraft({
        profileId: user.profileId,
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
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user.profileId] }),
      ])

      if (payload.submitAfterSave) {
        navigate(paths.admin.listings, { replace: true })
      } else {
        navigate(paths.admin.editListing(listingId), { replace: true })
      }
    },
  })

  if (referencesQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando referências para o anúncio administrativo...
      </div>
    )
  }

  if (referencesQuery.isError || settingsQuery.isError || !referencesQuery.data) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar categorias, materiais e dados básicos da Zap Sucatas."
        title="Falha ao abrir o formulário"
        tone="error"
      />
    )
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        description="Cadastre um anúncio institucional da Zap Sucatas usando o mesmo fluxo operacional do marketplace."
        eyebrow="Admin / anúncios"
        title="Novo anúncio da Zap Sucatas"
      />

      <ListingEditor
        key={`admin-new-listing:${settingsQuery.data?.siteName ?? 'site'}:${settingsQuery.data?.supportPhone ?? 'phone'}`}
        cancelTo={paths.admin.listings}
        categories={referencesQuery.data.categories}
        defaultValues={defaultValues}
        finalActionDescription="Salve o anúncio como rascunho ou publique diretamente no catálogo da Zap Sucatas quando os dados estiverem prontos."
        finalActionLabel="Salvar e publicar agora"
        isSubmitting={createMutation.isPending}
        materials={referencesQuery.data.materials}
        mode="create"
        onSubmit={createMutation.mutateAsync}
        status="draft"
      />
    </section>
  )
}
