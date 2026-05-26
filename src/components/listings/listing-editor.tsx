import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
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
  cityOptionsByState: Record<string, string[]>
  defaultValues: ListingFormValues
  existingImages?: ListingImage[]
  finalActionDescription?: string
  finalActionLabel?: string
  isSubmitting?: boolean
  materials: ListingMaterial[]
  mode: 'create' | 'edit'
  onSubmit: (payload: ListingEditorSubmitPayload) => Promise<void>
  rejectionReason?: string | null
  stateOptions: string[]
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

function resolveInitialCoverImageKey(images: ListingImage[]) {
  const coverImage = images.find((image) => image.isCover)

  if (coverImage) {
    return buildExistingImageKey(coverImage.id)
  }

  return images[0] ? buildExistingImageKey(images[0].id) : null
}

function formatContactPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits.length === 0 ? '' : `(${digits}`
  }

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`
  }

  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

const CONDITION_OPTIONS = [
  'Novo',
  'Seminovo',
  'Usado',
  'Sucata prensada',
  'Sucata em lote',
  'Reciclavel',
] as const

const PRICE_OPTIONS = [
  'Sob consulta',
  'A combinar',
  'Preco por kg',
  'Preco por tonelada',
  'Faixa negociavel',
] as const

const OTHER_CONDITION_VALUE = '__other_condition__'
const CUSTOM_PRICE_VALUE = '__custom_price__'

function formatBRLInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const numericValue = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

function FormField({
  children,
  fieldId,
  label,
}: {
  children: ReactNode
  fieldId?: string
  label: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={fieldId}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function ListingEditor({
  cancelTo,
  categories,
  cityOptionsByState,
  defaultValues,
  existingImages,
  finalActionDescription,
  finalActionLabel,
  isSubmitting = false,
  materials,
  mode,
  onSubmit,
  rejectionReason,
  stateOptions,
  status,
}: ListingEditorProps) {
  const resolvedExistingImages = existingImages ?? EMPTY_EXISTING_IMAGES
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [coverImageKey, setCoverImageKey] = useState<string | null>(
    resolveInitialCoverImageKey(resolvedExistingImages),
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
  const selectedState = form.watch('state')
  const conditionValue = form.watch('conditionType') ?? ''
  const priceValue = form.watch('priceLabel') ?? ''
  const availableCities = useMemo(
    () => cityOptionsByState[selectedState?.trim().toUpperCase()] ?? [],
    [cityOptionsByState, selectedState],
  )
  const selectedConditionOption = CONDITION_OPTIONS.includes(conditionValue as (typeof CONDITION_OPTIONS)[number])
    ? conditionValue
    : OTHER_CONDITION_VALUE
  const selectedPriceOption = PRICE_OPTIONS.includes(priceValue as (typeof PRICE_OPTIONS)[number])
    ? priceValue
    : CUSTOM_PRICE_VALUE

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

  const availableImageKeys = useMemo(
    () => [
      ...activeExistingImages.map((image) => buildExistingImageKey(image.id)),
      ...pendingFiles.map((item) => buildPendingImageKey(item.clientId)),
    ],
    [activeExistingImages, pendingFiles],
  )
  const normalizedImageOrderKeys = useMemo(() => availableImageKeys, [availableImageKeys])
  const resolvedCoverImageKey = useMemo(() => {
    if (coverImageKey && availableImageKeys.includes(coverImageKey)) {
      return coverImageKey
    }

    return normalizedImageOrderKeys[0] ?? null
  }, [availableImageKeys, coverImageKey, normalizedImageOrderKeys])

  const orderedImageItems = useMemo<OrderedImageItem[]>(() => {
    const existingMap = new Map(activeExistingImages.map((image) => [image.id, image]))

    return normalizedImageOrderKeys
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
  }, [activeExistingImages, normalizedImageOrderKeys, pendingFileMap])

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [pendingFiles])

  useEffect(() => {
    const currentCity = form.getValues('city')?.trim()

    if (!currentCity) {
      return
    }

    if (!availableCities.includes(currentCity)) {
      form.setValue('city', '', { shouldDirty: true, shouldValidate: true })
    }
  }, [availableCities, form])

  async function handleSubmit(values: ListingFormSchemaValues, shouldSubmitAfterSave: boolean) {
    try {
      setFeedback(null)
      setSubmitAfterSave(shouldSubmitAfterSave)

      await onSubmit({
        coverImageKey: resolvedCoverImageKey,
        imageOrderKeys: normalizedImageOrderKeys,
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
              <FormField fieldId="listing-title" label="Titulo">
                <Input id="listing-title" {...form.register('title')} />
                {form.formState.errors.title ? (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                ) : null}
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField fieldId="listing-category" label="Categoria">
                  <Select id="listing-category" {...form.register('categoryId')}>
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                  {form.formState.errors.categoryId ? (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.categoryId.message}
                    </p>
                  ) : null}
                </FormField>

                <FormField fieldId="listing-material" label="Material principal">
                  <Select id="listing-material" {...form.register('primaryMaterialId')}>
                    <option value="">Não informado</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField fieldId="listing-summary" label="Resumo comercial">
                <Textarea
                  id="listing-summary"
                  {...form.register('summary')}
                  className="min-h-24"
                  maxLength={240}
                />
                <p className="text-xs text-muted-foreground">
                  Descreva o lote em poucas linhas: tipo de sucata, volume, diferencial e objetivo da negociacao.
                </p>
                {form.formState.errors.summary ? (
                  <p className="text-sm text-red-600">{form.formState.errors.summary.message}</p>
                ) : null}
              </FormField>

              <FormField fieldId="listing-description" label="Descricao">
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <ReactQuill
                      id="listing-description"
                      modules={{
                        toolbar: [
                          [{ header: [2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          ['link', 'blockquote'],
                          ['clean'],
                        ],
                      }}
                      onChange={field.onChange}
                      theme="snow"
                      value={field.value ?? ''}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Detalhe composicao, estado do material, quantidade, forma de retirada/entrega e condicoes comerciais.
                </p>
                {form.formState.errors.description ? (
                  <p className="text-sm text-red-600">
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
              <FormField fieldId="listing-state" label="Estado">
                <Select id="listing-state" {...form.register('state')}>
                  <option value="">Selecione o estado</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
                {form.formState.errors.state ? (
                  <p className="text-sm text-red-600">{form.formState.errors.state.message}</p>
                ) : null}
              </FormField>

              <FormField fieldId="listing-city" label="Cidade">
                <Select
                  disabled={!selectedState || availableCities.length === 0}
                  id="listing-city"
                  {...form.register('city')}
                >
                  <option value="">
                    {!selectedState
                      ? 'Selecione o estado primeiro'
                      : availableCities.length === 0
                        ? 'Sem cidades disponíveis'
                        : 'Selecione a cidade'}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
                {form.formState.errors.city ? (
                  <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>
                ) : null}
              </FormField>

              <FormField fieldId="listing-contact-name" label="Nome de contato">
                <Input id="listing-contact-name" {...form.register('contactName')} />
              </FormField>

              <FormField fieldId="listing-contact-phone" label="Telefone de contato">
                <Input
                  id="listing-contact-phone"
                  placeholder="(11) 99999-9999"
                  {...form.register('contactPhone', {
                    onChange: (event) => {
                      event.target.value = formatContactPhone(event.target.value)
                    },
                  })}
                />
              </FormField>

              <FormField fieldId="listing-condition" label="Condicao">
                <Select
                  id="listing-condition"
                  onChange={(event) => {
                    const value = event.target.value
                    if (value !== OTHER_CONDITION_VALUE) {
                      form.setValue('conditionType', value, { shouldDirty: true, shouldValidate: true })
                    } else if (CONDITION_OPTIONS.includes(conditionValue as (typeof CONDITION_OPTIONS)[number])) {
                      form.setValue('conditionType', '', { shouldDirty: true, shouldValidate: true })
                    }
                  }}
                  value={selectedConditionOption}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={OTHER_CONDITION_VALUE}>Outra condição</option>
                </Select>
                {selectedConditionOption === OTHER_CONDITION_VALUE ? (
                  <Input
                    className="mt-2"
                    id="listing-condition-custom"
                    onChange={(event) =>
                      form.setValue('conditionType', event.target.value, { shouldDirty: true, shouldValidate: true })
                    }
                    placeholder="Digite a condição específica"
                    value={conditionValue}
                  />
                ) : null}
              </FormField>

              <FormField fieldId="listing-price" label="Faixa de preço">
                <Select
                  id="listing-price"
                  onChange={(event) => {
                    const value = event.target.value
                    if (value !== CUSTOM_PRICE_VALUE) {
                      form.setValue('priceLabel', value, { shouldDirty: true, shouldValidate: true })
                    } else if (PRICE_OPTIONS.includes(priceValue as (typeof PRICE_OPTIONS)[number])) {
                      form.setValue('priceLabel', '', { shouldDirty: true, shouldValidate: true })
                    }
                  }}
                  value={selectedPriceOption}
                >
                  {PRICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={CUSTOM_PRICE_VALUE}>Inserir valor</option>
                </Select>
                {selectedPriceOption === CUSTOM_PRICE_VALUE ? (
                  <Input
                    className="mt-2"
                    id="listing-price-custom"
                    onChange={(event) =>
                      form.setValue('priceLabel', formatBRLInput(event.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="R$ 0,00"
                    value={priceValue}
                  />
                ) : null}
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
                      <p className="text-sm text-red-600">
                        {form.formState.errors.attributes[index]?.attributeLabel?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Valor</label>
                    <Input {...form.register(`attributes.${index}.attributeValue`)} />
                    {form.formState.errors.attributes?.[index]?.attributeValue ? (
                      <p className="text-sm text-red-600">
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
                  <p className="text-xs text-muted-foreground">
                    Recomendado: proporção 16:10 (ex.: 1600x1000) para melhor encaixe no catálogo.
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
                <div className="grid grid-cols-2 gap-3">
                  {orderedImageItems.map((item, index) => {
                    const isCover = resolvedCoverImageKey === item.key

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          'overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm',
                          isCover ? 'border-primary/60 ring-2 ring-primary/35' : undefined,
                        )}
                      >
                        <div className="p-3">
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                            <img
                              alt={
                                item.kind === 'existing'
                                  ? item.image.altText ?? 'Imagem do anúncio'
                                  : item.item.file.name
                              }
                              className="h-full w-full object-cover"
                              src={item.kind === 'existing' ? item.image.publicUrl : item.item.previewUrl}
                            />
                            {isCover ? (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
                                <Star className="size-3" />
                                Capa
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 space-y-2">
                            <p className="line-clamp-2 text-xs font-medium text-foreground">
                              {item.kind === 'existing' ? `Imagem ${index + 1}` : item.item.file.name}
                            </p>
                            <div className="grid gap-2">
                              <Button
                                className="h-8 w-full px-2 text-xs font-medium"
                                onClick={() => setCoverImageKey(item.key)}
                                size="sm"
                                type="button"
                                variant={isCover ? 'default' : 'outline'}
                              >
                                {isCover ? 'Capa selecionada' : 'Definir capa'}
                              </Button>
                              <Button
                                className="h-8 w-full px-2 text-xs font-medium"
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
