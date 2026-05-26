import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  createListingDraft,
  fetchListingReferences,
  reorderListingImages,
  submitListingForReview,
  uploadListingImages,
} from '@/domains/listings/api'
import { createEmptyListingFormValues } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function AppNewListingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ListingEditorSubmitPayload) => {
      if (!user?.profileId) {
        throw new Error('Perfil do usuário não encontrado.')
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
        await submitListingForReview(listingId)
      }

      await queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user.profileId] })

      if (payload.submitAfterSave) {
        navigate(paths.app.listings, { replace: true })
      } else {
        navigate(paths.app.editListing(listingId), { replace: true })
      }
    },
  })

  if (referencesQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        Carregando categorias e materiais...
      </div>
    )
  }

  if (referencesQuery.isError || !referencesQuery.data) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar categorias e materiais para o formulário."
        title="Falha ao carregar referências"
        tone="error"
      />
    )
  }

  return (
    <ListingEditor
      key="app-new-listing"
      cancelTo={paths.app.listings}
      categories={referencesQuery.data.categories}
      cityOptionsByState={referencesQuery.data.stateCityMap}
      defaultValues={createEmptyListingFormValues()}
      isSubmitting={createMutation.isPending}
      materials={referencesQuery.data.materials}
      mode="create"
      onSubmit={createMutation.mutateAsync}
      stateOptions={referencesQuery.data.states}
      status="draft"
    />
  )
}
