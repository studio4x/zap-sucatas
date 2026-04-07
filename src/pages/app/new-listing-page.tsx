import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import { Card, CardContent } from '@/components/ui/card'
import {
  createListingDraft,
  fetchListingReferences,
  submitListingForReview,
  syncListingCoverImage,
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
        throw new Error('Perfil do usuario nao encontrado.')
      }

      const listingId = await createListingDraft({
        profileId: user.profileId,
        values: payload.values,
      })

      if (payload.newFiles.length > 0) {
        await uploadListingImages({
          authUserId: user.id,
          files: payload.newFiles,
          listingId,
        })
      }

      await syncListingCoverImage(listingId, payload.coverImageId)

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
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando categorias e materiais...
        </CardContent>
      </Card>
    )
  }

  if (referencesQuery.isError || !referencesQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar as referencias do formulario.
        </CardContent>
      </Card>
    )
  }

  return (
    <ListingEditor
      cancelTo={paths.app.listings}
      categories={referencesQuery.data.categories}
      defaultValues={createEmptyListingFormValues()}
      isSubmitting={createMutation.isPending}
      materials={referencesQuery.data.materials}
      mode="create"
      onSubmit={createMutation.mutateAsync}
      status="draft"
    />
  )
}
