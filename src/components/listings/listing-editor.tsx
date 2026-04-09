import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { DashboardFormSection } from '@/components/dashboard/dashboard-form-section'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { listingFormSchema, type ListingFormSchemaValues } from '@/domains/listings/schemas'
import type {
  ListingCategory,
  ListingFormValues,
  ListingImage,
  ListingMaterial,
  ListingStatus,
} from '@/domains/listings/types'
import { cn } from '@/lib/utils'

export type ListingEditorPendingUpload = {
  file: File
  key: string
}

export type ListingEditorSubmitPayload = {
  coverImageKey: string | null
  imageOrderKeys: string[]
  newUploads: ListingEditorPendingUpload[]
  removedImages: ListingImage[]
  submitAfterSave: boolean
  values: ListingFormValues
}

type ListingEditorProps = {
  cancelTo: string
  categories: ListingCategory[]
  defaultValues: ListingFormValues
  existingImages?: ListingImage[]
  finalActionDescription?: string
  finalActionLabel?: string
  isSubmitting?: boolean
  materials: ListingMaterial[]
  mode: 'create' | 'edit'
  onSubmit: (payload: ListingEditorSubmitPayload) => Promise<void>
  rejectionReason?: string | null
  status?: ListingStatus | null
}

type PendingFile = {
  clientId: string
  file: File
  previewUrl: string
}

type OrderedImageItem =
  | {
      id: string
      image: ListingImage
      key: string
      kind: 'existing'
    }
  | {
      id: string
      item: PendingFile
      key: string
      kind: 'pending'
    }

const EMPTY_EXISTING_IMAGES: ListingImage[] = []

function buildExistingImageKey(imageId: string) {
  return `existing:${imageId}`
}

function buildPendingImageKey(clientId: string) {
  return `pending:${clientId}`
}

function FormField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function arraysAreEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

export function ListingEditor({
  cancelTo,
  categories,
  defaultValues,
  existingImages,
  finalActionDescription,
  finalActionLabel,
  isSubmitting = false,
  materials,
  mode,
  onSubmit,
  rejectionReason,
  status,
}: ListingEditorProps) {
  const resolvedExistingImages = existingImages ?? EMPTY_EXISTING_IMAGES
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [imageOrderKeys, setImageOrderKeys] = useState<string[]>(
    resolvedExistingImages.map((image) => buildExistingImageKey(image.id)),
  )
  const [coverImageKey, setCoverImageKey] = useState<string | null>(
    resolvedExistingImages.find((image) => image.isCover)
      ? buildExistingImageKey(resolvedExistingImages.find((image) => image.isCover)!.id)
      : resolvedExistingImages[0]
        ? buildExistingImageKey(resolvedExistingImages[0].id)
        : null,
  )
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' } | null>(
    null,
  )
  const [submitAfterSave, setSubmitAfterSave] = useState(false)

  const form = useForm<ListingFormSchemaValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues,
  })

  const attributesFieldArray = useFieldArray({
    control: form.control,
    name: 'attributes',
  })

  const activeExistingImages = useMemo(
    () => resolvedExistingImages.filter((image) => !removedImageIds.includes(image.id)),
    [resolvedExistingImages, removedImageIds],
  )
  const removedExistingImages = useMemo(
    () => resolvedExistingImages.filter((image) => removedImageIds.includes(image.id)),
    [resolvedExistingImages, removedImageIds],
  )
  const pendingFileMap = useMemo(
    () => new Map(pendingFiles.map((item) => [item.clientId, item])),
    [pendingFiles],
  )

  const orderedImageItems = useMemo<OrderedImageItem[]>(() => {
    const existingMap = new Map(activeExistingImages.map((image) => [image.id, image]))

    return imageOrderKeys
      .map((key) => {
        if (key.startsWith('existing:')) {
          const imageId = key.slice('existing:'.length)
          const image = existingMap.get(imageId)

          if (!image) {
            return null
          }

          return {
            id: image.id,
            image,
            key,
            kind: 'existing',
          } satisfies OrderedImageItem
        }

        if (key.startsWith('pending:')) {
          const clientId = key.slice('pending:'.length)
          const item = pendingFileMap.get(clientId)

          if (!item) {
            return null
          }

          return {
            id: item.clientId,
            item,
            key,
            kind: 'pending',
          } satisfies OrderedImageItem
        }

        return null
      })
      .filter((item): item is OrderedImageItem => item !== null)
  }, [activeExistingImages, imageOrderKeys, pendingFileMap])

  useEffect(() => {
    form.reset(defaultValues)
    setPendingFiles([])
    setRemovedImageIds([])
    const nextKeys = resolvedExistingImages.map((image) => buildExistingImageKey(image.id))
    setImageOrderKeys(nextKeys)
    const nextCoverKey = resolvedExistingImages.find((image) => image.isCover)
      ? buildExistingImageKey(resolvedExistingImages.find((image) => image.isCover)!.id)
      : nextKeys[0] ?? null
    setCoverImageKey(nextCoverKey)
    setFeedback(null)
  }, [defaultValues, resolvedExistingImages, form])

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [pendingFiles])

  useEffect(() => {
    const availableKeys = [
      ...activeExistingImages.map((image) => buildExistingImageKey(image.id)),
      ...pendingFiles.map((item) => buildPendingImageKey(item.clientId)),
    ]
    const availableSet = new Set(availableKeys)

    setImageOrderKeys((current) => {
      const next = current.filter((key) => availableSet.has(key))

      availableKeys.forEach((key) => {
        if (!next.includes(key)) {
          next.push(key)
        }
      })

      return arraysAreEqual(current, next) ? current : next
    })

    setCoverImageKey((current) => {
      if (current && availableSet.has(current)) {
        return current
      }

      return availableKeys[0] ?? null
    })
  }, [activeExistingImages, pendingFiles])

  async function handleSubmit(values: ListingFormSchemaValues, shouldSubmitAfterSave: boolean) {
    try {
      setFeedback(null)
      setSubmitAfterSave(shouldSubmitAfterSave)

      await onSubmit({
        coverImageKey,
        imageOrderKeys,
        newUploads: orderedImageItems
          .filter((item) => item.kind === 'pending')
          .map((item) => ({
            file: item.item.file,
            key: item.key,
          })),
        removedImages: resolvedExistingImages.filter((image) => removedImageIds.includes(image.id)),
        submitAfterSave: shouldSubmitAfterSave,
        values: {
          ...values,
          attributes: values.attributes ?? [],
        },
      })

      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setPendingFiles([])
      setRemovedImageIds([])
      setSubmitAfterSave(false)

      if (!shouldSubmitAfterSave) {
        setFeedback({
          message: 'Rascunho salvo com sucesso.',
          tone: 'success',
        })
      }
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : 'Falha ao salvar o anúncio.',
        tone: 'error',
      })
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    setPendingFiles((current) => [
      ...current,
      ...files.map((file) => ({
        clientId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])

    event.target.value = ''
  }

  function removePendingFile(clientId: string) {
    setPendingFiles((current) => {
      const target = current.find((item) => item.clientId === clientId)

      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }

      return current.filter((item) => item.clientId !== clientId)
    })
  }

  function removeExistingImage(imageId: string) {
    setRemovedImageIds((current) => (current.includes(imageId) ? current : [...current, imageId]))
  }

  function restoreExistingImage(imageId: string) {
    setRemovedImageIds((current) => current.filter((id) => id !== imageId))
  }

  function moveImage(key: string, direction: 'down' | 'up') {
    setImageOrderKeys((current) => {
      const index = current.findIndex((item) => item === key)

      if (index === -1) {
        return current
      }

      const nextIndex = direction === 'up' ? index - 1 : index + 1

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const next = [...current]
      const currentValue = next[index]
      next[index] = next[nextIndex]
      next[nextIndex] = currentValue
      return next
    })
  }

  const canSubmitForReview = orderedImageItems.length > 0
  const resolvedFinalActionLabel = finalActionLabel ?? 'Salvar e enviar para revisão'
  const resolvedFinalActionDescription =
    finalActionDescription ??
    'Salve quantas vezes precisar. Quando os dados estiverem completos, envie para revisão.'

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit((values) => handleSubmit(values, false))}>
      <DashboardSectionHeader
        action={
          <div className="flex flex-wrap items-center gap-3">
            {status ? <ListingStatusBadge status={status} /> : null}
            <Button asChild type="button" variant="outline">
              <Link to={cancelTo}>Voltar</Link>
            </Button>
          </div>
        }
        description="Preencha os dados do lote, organize as imagens e escolha se quer apenas salvar ou enviar para moderação."
        title={mode === 'create' ? 'Criar anúncio' : 'Editar anúncio'}
      />

      {rejectionReason ? (
        <DashboardAlertCard
          description={rejectionReason}
          title="Motivo da rejeição anterior"
          tone="warning"
        />
      ) : null}

      {status === 'archived' ? (
        <DashboardAlertCard
          description="Anuncios arquivados nao podem ser editados novamente nesta etapa do MVP."
          title="Anuncio arquivado"
          tone="warning"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <DashboardFormSection
            description="Esses campos entram no card do catálogo e na validação da moderação."
            title="Dados principais"
          >
            <div className="grid gap-4">
              <FormField label="Titulo">
                <Input {...form.register('title')} />
                {form.formState.errors.title ? (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                ) : null}
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Categoria">
                  <Select {...form.register('categoryId')}>
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                  {form.formState.errors.categoryId ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.categoryId.message}
                    </p>
                  ) : null}
                </FormField>

                <FormField label="Material principal">
                  <Select {...form.register('primaryMaterialId')}>
                    <option value="">Não informado</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField label="Resumo comercial">
                <Textarea {...form.register('summary')} className="min-h-24" maxLength={240} />
                {form.formState.errors.summary ? (
                  <p className="text-sm text-destructive">{form.formState.errors.summary.message}</p>
                ) : null}
              </FormField>

              <FormField label="Descricao">
                <Textarea {...form.register('description')} className="min-h-40" />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </FormField>
            </div>
          </DashboardFormSection>

          <DashboardFormSection
            description="Dados usados no detalhe do anúncio e no filtro geográfico do catálogo."
            title="Localizacao e contato"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Cidade">
                <Input {...form.register('city')} />
                {form.formState.errors.city ? (
                  <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                ) : null}
              </FormField>

              <FormField label="Estado">
                <Input {...form.register('state')} maxLength={2} placeholder="SP" />
                {form.formState.errors.state ? (
                  <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                ) : null}
              </FormField>

              <FormField label="Nome de contato">
                <Input {...form.register('contactName')} />
              </FormField>

              <FormField label="Telefone de contato">
                <Input {...form.register('contactPhone')} />
              </FormField>

              <FormField label="Condicao">
                <Input
                  {...form.register('conditionType')}
                  placeholder="Ex.: usado, em lote, sucata prensada"
                />
              </FormField>

              <FormField label="Faixa de preço">
                <Input {...form.register('priceLabel')} placeholder="Ex.: sob consulta, a combinar" />
              </FormField>
            </div>
          </DashboardFormSection>

          <DashboardFormSection
            actions={
              <Button
                onClick={() => attributesFieldArray.append({ attributeLabel: '', attributeValue: '' })}
                type="button"
                variant="outline"
              >
                Adicionar atributo
              </Button>
            }
            description="Informacoes adicionais para detalhar o lote, peso, volume ou especificacao."
            title="Atributos tecnicos"
          >
            <div className="space-y-4">
              {attributesFieldArray.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum atributo adicionado ainda. Isso e opcional.
                </p>
              ) : null}

              {attributesFieldArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-3xl border border-border/70 p-4 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Rotulo</label>
                    <Input {...form.register(`attributes.${index}.attributeLabel`)} />
                    {form.formState.errors.attributes?.[index]?.attributeLabel ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.attributes[index]?.attributeLabel?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Valor</label>
                    <Input {...form.register(`attributes.${index}.attributeValue`)} />
                    {form.formState.errors.attributes?.[index]?.attributeValue ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.attributes[index]?.attributeValue?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => attributesFieldArray.remove(index)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DashboardFormSection>
        </div>

        <div className="space-y-6">
          <DashboardFormSection
            description="Organize a ordem real da galeria. Uma capa forte melhora a leitura no catálogo."
            title="Imagens"
          >
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-5 py-8 text-center transition hover:border-primary/40 hover:bg-primary/5">
                <ImagePlus className="size-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Selecionar imagens</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP. Você pode escolher várias imagens de uma vez.
                  </p>
                </div>
                <input accept="image/*" className="hidden" multiple onChange={handleFileSelection} type="file" />
              </label>

              {orderedImageItems.length === 0 ? (
                <DashboardEmptyState
                  className="px-4 py-8"
                  description="Adicione imagens e organize a ordem antes de enviar para revisão."
                  title="Nenhuma imagem pronta"
                />
              ) : (
                <div className="grid gap-3">
                  {orderedImageItems.map((item, index) => {
                    const isCover = coverImageKey === item.key
                    const isFirst = index === 0
                    const isLast = index === orderedImageItems.length - 1

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          'overflow-hidden rounded-2xl border border-border/70 bg-card',
                          isCover ? 'ring-2 ring-primary/35' : undefined,
                        )}
                      >
                        <div className="grid gap-4 p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                            <img
                              alt={
                                item.kind === 'existing'
                                  ? item.image.altText ?? 'Imagem do anúncio'
                                  : item.item.file.name
                              }
                              className="h-full w-full object-cover"
                              src={item.kind === 'existing' ? item.image.publicUrl : item.item.previewUrl}
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                {item.kind === 'existing' ? 'Imagem atual' : 'Novo upload'}
                              </span>
                              {isCover ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                  <Star className="size-3.5" />
                                  Capa
                                </span>
                              ) : null}
                            </div>

                            <p className="text-sm font-medium text-foreground">
                              {item.kind === 'existing'
                                ? `Imagem ${index + 1}`
                                : item.item.file.name}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={isFirst}
                                onClick={() => moveImage(item.key, 'up')}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <ArrowUp className="size-4" />
                                Subir
                              </Button>
                              <Button
                                disabled={isLast}
                                onClick={() => moveImage(item.key, 'down')}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <ArrowDown className="size-4" />
                                Descer
                              </Button>
                              <Button
                                onClick={() => setCoverImageKey(item.key)}
                                size="sm"
                                type="button"
                                variant={isCover ? 'default' : 'outline'}
                              >
                                {isCover ? 'Capa selecionada' : 'Definir capa'}
                              </Button>
                              <Button
                                onClick={() =>
                                  item.kind === 'existing'
                                    ? removeExistingImage(item.image.id)
                                    : removePendingFile(item.item.clientId)
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {removedExistingImages.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Imagens marcadas para remocao
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {removedExistingImages.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background">
                        <div className="aspect-square bg-muted">
                          <img
                            alt={image.altText ?? 'Imagem removida do anúncio'}
                            className="h-full w-full object-cover opacity-70"
                            src={image.publicUrl}
                          />
                        </div>
                        <div className="p-4">
                          <Button onClick={() => restoreExistingImage(image.id)} size="sm" type="button" variant="outline">
                            Desfazer remocao
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </DashboardFormSection>

          {feedback ? (
            <DashboardAlertCard
              description={feedback.message}
              title={feedback.tone === 'success' ? 'Rascunho salvo' : 'Ajuste necessario'}
              tone={feedback.tone}
            />
          ) : null}

          <DashboardFormSection description={resolvedFinalActionDescription} title="Publicacao">
            <div className="space-y-3">
              <Button
                disabled={isSubmitting || status === 'archived'}
                onClick={() => void form.handleSubmit((values) => handleSubmit(values, false))()}
                type="button"
                variant="outline"
              >
                {isSubmitting && !submitAfterSave ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
              <Button
                disabled={isSubmitting || !canSubmitForReview || status === 'archived'}
                onClick={() => void form.handleSubmit((values) => handleSubmit(values, true))()}
                type="button"
              >
                {isSubmitting && submitAfterSave ? 'Processando...' : resolvedFinalActionLabel}
              </Button>
              {!canSubmitForReview ? (
                <DashboardEmptyState
                  className="px-4 py-8"
                  description="Adicione fotos do lote antes de enviar para revisão."
                  title="Ainda faltam imagens"
                />
              ) : null}
            </div>
          </DashboardFormSection>
        </div>
      </div>
    </form>
  )
}
