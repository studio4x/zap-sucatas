import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  fetchListingDetailsForOwner,
  fetchListingReferences,
  removeListingImage,
  reorderListingImages,
  submitListingForReview,
  updateListingDraft,
  uploadListingImages,
} from '@/domains/listings/api'
import { listingToFormValues } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function AppEditListingPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })

  const listingQuery = useQuery({
    queryKey: ['listing', 'owner', id],
    queryFn: () => fetchListingDetailsForOwner(id),
    enabled: Boolean(id),
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: ListingEditorSubmitPayload) => {
      if (!user?.id) {
        throw new Error('Sessão inválida.')
      }

      await updateListingDraft({
        listingId: id,
        values: payload.values,
      })

      for (const image of payload.removedImages) {
        await removeListingImage(image)
      }

      const uploadedImages =
        payload.newUploads.length > 0
          ? await uploadListingImages({
              authUserId: user.id,
              files: payload.newUploads.map((upload) => upload.file),
              listingId: id,
            })
          : []

      const uploadedImageIdsByKey = new Map(
        payload.newUploads.map((upload, index) => [upload.key, uploadedImages[index]?.id ?? null]),
      )
      const orderedImageIds = payload.imageOrderKeys
        .map((key) => {
          if (key.startsWith('existing:')) {
            return key.slice('existing:'.length)
          }

          return uploadedImageIdsByKey.get(key) ?? null
        })
        .filter((value): value is string => Boolean(value))
      const resolvedCoverImageId = payload.coverImageKey
        ? payload.coverImageKey.startsWith('existing:')
          ? payload.coverImageKey.slice('existing:'.length)
          : uploadedImageIdsByKey.get(payload.coverImageKey) ?? null
        : null

      if (orderedImageIds.length > 0) {
        await reorderListingImages({
          coverImageId: resolvedCoverImageId,
          listingId: id,
          orderedImageIds,
        })
      }

      if (payload.submitAfterSave) {
        await submitListingForReview(id)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', 'owner', id] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner', user.profileId] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])

      if (payload.submitAfterSave) {
        navigate(paths.app.listings, { replace: true })
      }
    },
  })

  if (referencesQuery.isLoading || listingQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        Carregando dados do anúncio...
      </div>
    )
  }

  if (
    referencesQuery.isError ||
    listingQuery.isError ||
    !referencesQuery.data ||
    !listingQuery.data
  ) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar este anúncio para edição."
        title="Falha ao abrir anúncio"
        tone="error"
      />
    )
  }

  if (listingQuery.data.status === 'archived') {
    return (
      <DashboardAlertCard
        description="Este anúncio foi arquivado e não pode mais ser editado nesta etapa do MVP."
        title="Anúncio arquivado"
        tone="warning"
      />
    )
  }

  return (
    <ListingEditor
      key={`${id}:${listingQuery.data.updatedAt}:${listingQuery.data.images.length}`}
      cancelTo={paths.app.listings}
      categories={referencesQuery.data.categories}
      cityOptionsByState={referencesQuery.data.stateCityMap}
      defaultValues={listingToFormValues(listingQuery.data)}
      existingImages={listingQuery.data.images}
      isSubmitting={updateMutation.isPending}
      materials={referencesQuery.data.materials}
      mode="edit"
      onSubmit={updateMutation.mutateAsync}
      rejectionReason={listingQuery.data.rejectionReason}
      stateOptions={referencesQuery.data.states}
      status={listingQuery.data.status}
    />
  )
}
