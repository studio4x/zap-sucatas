import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando dados do anuncio...
        </CardContent>
      </Card>
    )
  }

  if (referencesQuery.isError || listingQuery.isError || !referencesQuery.data || !listingQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar o anuncio para edicao.
        </CardContent>
      </Card>
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
