import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  fetchListingDetailsForOwner,
  fetchListingReferences,
  removeListingImage,
  submitListingForReview,
  syncListingCoverImage,
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
        throw new Error('Sessao invalida.')
      }

      await updateListingDraft({
        listingId: id,
        values: payload.values,
      })

      for (const image of payload.removedImages) {
        await removeListingImage(image)
      }

      if (payload.newFiles.length > 0) {
        await uploadListingImages({
          authUserId: user.id,
          files: payload.newFiles,
          listingId: id,
        })
      }

      await syncListingCoverImage(id, payload.coverImageId)

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
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando dados do anuncio...
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
        description="Nao foi possivel carregar este anuncio para edicao."
        title="Falha ao abrir anuncio"
        tone="error"
      />
    )
  }

  return (
    <ListingEditor
      cancelTo={paths.app.listings}
      categories={referencesQuery.data.categories}
      defaultValues={listingToFormValues(listingQuery.data)}
      existingImages={listingQuery.data.images}
      isSubmitting={updateMutation.isPending}
      materials={referencesQuery.data.materials}
      mode="edit"
      onSubmit={updateMutation.mutateAsync}
      rejectionReason={listingQuery.data.rejectionReason}
      status={listingQuery.data.status}
    />
  )
}
