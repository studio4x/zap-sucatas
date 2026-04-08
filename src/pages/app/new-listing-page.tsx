import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
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
        throw new Error('Perfil do usuário não encontrado.')
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
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
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
