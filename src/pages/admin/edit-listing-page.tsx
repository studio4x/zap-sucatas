import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { ListingEditor, type ListingEditorSubmitPayload } from '@/components/listings/listing-editor'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import {
  approveListing,
  archiveListing,
  fetchBrazilLocalities,
  fetchListingDetailsForAdmin,
  fetchListingReferences,
  removeListingImage,
  reorderListingImages,
  updateListingDraft,
  uploadListingImages,
} from '@/domains/listings/api'
import { listingToFormValues } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export function AdminEditListingPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })
  const brazilLocalitiesQuery = useQuery({
    queryKey: ['listing-localities', 'brazil'],
    queryFn: fetchBrazilLocalities,
    staleTime: 1000 * 60 * 60 * 24,
  })
  const listingQuery = useQuery({
    queryKey: ['listing', 'admin', id],
    queryFn: () => fetchListingDetailsForAdmin(id),
    enabled: Boolean(id),
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: ListingEditorSubmitPayload) => {
      if (!user?.id) {
        throw new Error('Sessão administrativa inválida.')
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
        await approveListing(id)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', 'admin', id] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])

      if (payload.submitAfterSave) {
        navigate(paths.admin.listingDetails(id), { replace: true })
      }
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveListing(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', 'admin', id] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
      ])
      setConfirmingArchive(false)
      navigate(paths.admin.listings, { replace: true })
    },
  })

  if (referencesQuery.isLoading || listingQuery.isLoading || brazilLocalitiesQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando anúncio administrativo...
      </div>
    )
  }

  if (
    referencesQuery.isError ||
    listingQuery.isError ||
    brazilLocalitiesQuery.isError ||
    !referencesQuery.data ||
    !listingQuery.data ||
    !brazilLocalitiesQuery.data
  ) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar este anúncio para edição administrativa."
        title="Falha ao abrir anúncio"
        tone="error"
      />
    )
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          listingQuery.data.status !== 'archived' ? (
            <Button
              disabled={updateMutation.isPending || archiveMutation.isPending}
              onClick={() => setConfirmingArchive(true)}
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" />
              {archiveMutation.isPending ? 'Removendo...' : 'Remover anúncio'}
            </Button>
          ) : undefined
        }
        description="Atualize o conteúdo, as imagens e os dados comerciais do anúncio criado pela operação."
        eyebrow="Admin / anúncios"
        title="Editar anúncio"
      />

      {archiveMutation.isError ? (
        <DashboardAlertCard
          description={
            archiveMutation.error instanceof Error
              ? archiveMutation.error.message
              : 'Não foi possível remover este anúncio da operação.'
          }
          title="Ajuste necessário"
          tone="error"
        />
      ) : null}

      <ListingEditor
        key={`${id}:${listingQuery.data.updatedAt}:${listingQuery.data.images.length}`}
        cancelTo={paths.admin.listingDetails(id)}
        categories={referencesQuery.data.categories}
        cityOptionsByState={brazilLocalitiesQuery.data.stateCityMap}
        defaultValues={listingToFormValues(listingQuery.data)}
        existingImages={listingQuery.data.images}
        finalActionDescription="Salve alterações em rascunho ou publique imediatamente o anúncio no catálogo quando o conteúdo estiver validado pela operação."
        finalActionLabel="Salvar e publicar agora"
        isSubmitting={updateMutation.isPending}
        materials={referencesQuery.data.materials}
        mode="edit"
        onSubmit={updateMutation.mutateAsync}
        rejectionReason={listingQuery.data.rejectionReason}
        stateOptions={brazilLocalitiesQuery.data.states}
        status={listingQuery.data.status}
      />

      <ConfirmActionDialog
        confirmLabel="Remover anúncio"
        description={`Remover o anúncio "${listingQuery.data.title}" da operação pública? Ele será arquivado e permanecerá apenas no histórico interno.`}
        isPending={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
        onOpenChange={setConfirmingArchive}
        open={confirmingArchive}
        title="Confirmar remoção"
        tone="default"
      />
    </section>
  )
}
