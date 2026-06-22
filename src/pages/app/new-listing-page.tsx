import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import {
  createListingDraft,
  fetchBrazilLocalities,
  fetchListingReferences,
  reorderListingImages,
  submitListingForReview,
  uploadListingImages,
} from '@/domains/listings/api'
import { createEmptyListingFormValues } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function AppNewListingPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })
  const brazilLocalitiesQuery = useQuery({
    queryKey: ['listing-localities', 'brazil'],
    queryFn: fetchBrazilLocalities,
    staleTime: 1000 * 60 * 60 * 24,
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

      return payload.submitAfterSave
        ? {
            actionLabel: 'Ir para meus anúncios',
            description: 'O anúncio foi criado e enviado para análise com sucesso.',
            redirectTo: paths.app.listings,
            title: 'Anúncio enviado para análise',
          }
        : {
            actionLabel: 'Abrir anúncio',
            description: 'O anúncio foi salvo como rascunho e está disponível para continuar a edição.',
            redirectTo: paths.app.editListing(listingId),
            title: 'Rascunho criado',
          }
    },
  })

  if (referencesQuery.isLoading || brazilLocalitiesQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        Carregando categorias e materiais...
      </div>
    )
  }

  if (referencesQuery.isError || brazilLocalitiesQuery.isError || !referencesQuery.data || !brazilLocalitiesQuery.data) {
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
      cityOptionsByState={brazilLocalitiesQuery.data.stateCityMap}
      defaultValues={createEmptyListingFormValues()}
      isSubmitting={createMutation.isPending}
      materials={referencesQuery.data.materials}
      mode="create"
      onSubmit={createMutation.mutateAsync}
      stateOptions={brazilLocalitiesQuery.data.states}
      status="draft"
    />
  )
}
