import { zodResolver } from '@hookform/resolvers/zod'
import { GripVertical, ImagePlus, Star, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardFormSection } from '@/components/dashboard/dashboard-form-section'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { SuccessNoticeDialog } from '@/components/shared/success-notice-dialog'
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

export type ListingEditorSuccessNotice = {
  actionLabel?: string
  description: string
  redirectTo?: string
  title: string
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
  onSubmit: (payload: ListingEditorSubmitPayload) => Promise<ListingEditorSuccessNotice>
  rejectionReason?: string | null
  showHeader?: boolean
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

function moveImageKey(keys: string[], draggedKey: string, targetKey: string) {
  if (draggedKey === targetKey) {
    return keys
  }

  const draggedIndex = keys.indexOf(draggedKey)
  const targetIndex = keys.indexOf(targetKey)

  if (draggedIndex === -1 || targetIndex === -1) {
    return keys
  }

  const next = keys.slice()
  next.splice(draggedIndex, 1)

  const normalizedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
  next.splice(normalizedTargetIndex, 0, draggedKey)

  return next
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
  'Preço por kg',
  'Preço por tonelada',
  'Faixa negociavel',
] as const

const ATTRIBUTE_LABEL_OPTIONS = [
  'Pureza',
  'Granulometria',
  'Liga',
  'Volume estimado',
  'Peso aproximado',
  'Unidade de venda',
  'Acondicionamento',
  'Origem do material',
  'Umidade',
  'Contaminação',
  'Cor predominante',
  'Disponibilidade',
] as const

const ATTRIBUTE_VALUE_PLACEHOLDERS: Record<string, string> = {
  Pureza: 'Ex.: 98% Cu',
  Granulometria: 'Ex.: 20 a 40 mm',
  Liga: 'Ex.: AISI 304',
  'Volume estimado': 'Ex.: 12 m3',
  'Peso aproximado': 'Ex.: 3,5 toneladas',
  'Unidade de venda': 'Ex.: kg, tonelada ou lote',
  Acondicionamento: 'Ex.: Big bag, fardo, granel',
  'Origem do material': 'Ex.: sobra industrial',
  Umidade: 'Ex.: 8%',
  Contaminação: 'Ex.: baixa, sem óleo',
  'Cor predominante': 'Ex.: cobre avermelhado',
  Disponibilidade: 'Ex.: retirada imediata',
}

const OTHER_CONDITION_VALUE = '__other_condition__'
const PRICE_OPTIONS_WITH_VALUE = ['Preço por kg', 'Preço por tonelada'] as const

function parsePriceLabel(value: string) {
  const normalized = value.trim()
  const withValueOption = PRICE_OPTIONS_WITH_VALUE.find((option) => normalized.startsWith(`${option}:`))

  if (withValueOption) {
    return {
      option: withValueOption,
      amount: normalized.slice(withValueOption.length + 1).trim(),
    }
  }

  if (PRICE_OPTIONS.includes(normalized as (typeof PRICE_OPTIONS)[number])) {
    return { option: normalized, amount: '' }
  }

  return { option: 'Sob consulta', amount: '' }
}

function formatBRLInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const numericValue = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

function normalizeHtmlForCodeView(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/>\s+</g, '>\n<')
    .trim()
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
  showHeader = true,
  stateOptions,
  status,
}: ListingEditorProps) {
  const navigate = useNavigate()
  const resolvedExistingImages = existingImages ?? EMPTY_EXISTING_IMAGES
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [coverImageKey, setCoverImageKey] = useState<string | null>(
    resolveInitialCoverImageKey(resolvedExistingImages),
  )
  const [imageOrderKeys, setImageOrderKeys] = useState<string[]>(() =>
    resolvedExistingImages.map((image) => buildExistingImageKey(image.id)),
  )
  const [draggingImageKey, setDraggingImageKey] = useState<string | null>(null)
  const draggingImageKeyRef = useRef<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<ListingEditorSuccessNotice | null>(null)
  const [submitAfterSave, setSubmitAfterSave] = useState(false)
  const [descriptionEditorTab, setDescriptionEditorTab] = useState<'html' | 'visual'>('visual')

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
  const parsedPrice = useMemo(() => parsePriceLabel(priceValue), [priceValue])
  const availableCities = useMemo(
    () => cityOptionsByState[selectedState?.trim().toUpperCase()] ?? [],
    [cityOptionsByState, selectedState],
  )
  const selectedConditionOption = CONDITION_OPTIONS.includes(conditionValue as (typeof CONDITION_OPTIONS)[number])
    ? conditionValue
    : OTHER_CONDITION_VALUE
  const selectedPriceOption = parsedPrice.option

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
  useEffect(() => {
    setImageOrderKeys((current) => {
      const availableKeySet = new Set(availableImageKeys)
      const next = current.filter((key) => availableKeySet.has(key))

      for (const key of availableImageKeys) {
        if (!next.includes(key)) {
          next.push(key)
        }
      }

      if (next.length === current.length && next.every((key, index) => key === current[index])) {
        return current
      }

      return next
    })
  }, [availableImageKeys])

  const resolvedCoverImageKey = useMemo(() => {
    if (coverImageKey && imageOrderKeys.includes(coverImageKey)) {
      return coverImageKey
    }

    return imageOrderKeys[0] ?? null
  }, [coverImageKey, imageOrderKeys])

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

      const successNotice = await onSubmit({
        coverImageKey: resolvedCoverImageKey,
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
      setSuccessNotice(successNotice)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Falha ao salvar o anúncio.')
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

  function handleImageDragStart(event: DragEvent<HTMLElement>, itemKey: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', itemKey)
    draggingImageKeyRef.current = itemKey
    setDraggingImageKey(itemKey)
  }

  function handleImageDragOver(event: DragEvent<HTMLElement>, itemKey: string) {
    event.preventDefault()

    const draggedKey = draggingImageKeyRef.current

    if (!draggedKey || draggedKey === itemKey) {
      return
    }

    setImageOrderKeys((current) => moveImageKey(current, draggedKey, itemKey))
  }

  function handleImageDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    draggingImageKeyRef.current = null
    setDraggingImageKey(null)
  }

  function handleImageDragEnd() {
    draggingImageKeyRef.current = null
    setDraggingImageKey(null)
  }

  const canSubmitForReview = orderedImageItems.length > 0
  const resolvedFinalActionLabel = finalActionLabel ?? 'Salvar e enviar para revisão'
  const resolvedFinalActionDescription =
    finalActionDescription ??
    'Salve quantas vezes precisar. Quando os dados estiverem completos, envie para revisão.'

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit((values) => handleSubmit(values, false))}>
      {showHeader ? (
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
      ) : null}

      {rejectionReason ? (
        <DashboardAlertCard
          description={rejectionReason}
          title="Motivo da rejeição anterior"
          tone="warning"
        />
      ) : null}

      {status === 'archived' ? (
        <DashboardAlertCard
          description="Anúncios arquivados não podem ser editados novamente nesta etapa do MVP."
          title="Anúncio arquivado"
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
              <FormField fieldId="listing-title" label="Título">
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
                        {category.pathLabel}
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

              <FormField fieldId="listing-description" label="Descrição">
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <div className="space-y-3">
                      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                        <button
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                            descriptionEditorTab === 'visual'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          onClick={() => setDescriptionEditorTab('visual')}
                          type="button"
                        >
                          Visual
                        </button>
                        <button
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                            descriptionEditorTab === 'html'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          onClick={() => setDescriptionEditorTab('html')}
                          type="button"
                        >
                          HTML
                        </button>
                      </div>

                      {descriptionEditorTab === 'visual' ? (
                        <div className="listing-editor rounded-[1.25rem] border border-border bg-background">
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
                        </div>
                      ) : (
                        <Textarea
                          className="min-h-72 font-mono text-sm"
                          id="listing-description-html"
                          onChange={(event) => field.onChange(event.target.value)}
                          spellCheck={false}
                          value={normalizeHtmlForCodeView(field.value ?? '')}
                        />
                      )}
                    </div>
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
            title="Localização e contato"
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
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    className="size-4 accent-primary"
                    type="checkbox"
                    {...form.register('contactPhoneIsWhatsapp')}
                  />
                  Este telefone também é WhatsApp
                </label>
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
                    if (PRICE_OPTIONS_WITH_VALUE.includes(value as (typeof PRICE_OPTIONS_WITH_VALUE)[number])) {
                      form.setValue('priceLabel', `${value}:`, { shouldDirty: true, shouldValidate: true })
                    } else {
                      form.setValue('priceLabel', value, { shouldDirty: true, shouldValidate: true })
                    }
                  }}
                  value={selectedPriceOption}
                >
                  {PRICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                {PRICE_OPTIONS_WITH_VALUE.includes(
                  selectedPriceOption as (typeof PRICE_OPTIONS_WITH_VALUE)[number],
                ) ? (
                  <Input
                    className="mt-2"
                    id="listing-price-custom"
                    onChange={(event) =>
                      form.setValue(
                        'priceLabel',
                        `${selectedPriceOption}: ${formatBRLInput(event.target.value)}`.trim(),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                    placeholder="R$ 0,00"
                    value={parsedPrice.amount}
                  />
                ) : null}
                {PRICE_OPTIONS_WITH_VALUE.includes(
                  selectedPriceOption as (typeof PRICE_OPTIONS_WITH_VALUE)[number],
                ) ? (
                  <p className="text-xs text-muted-foreground">
                    Informe o valor em reais para {selectedPriceOption.toLowerCase()}.
                  </p>
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
            description="Informações adicionais para detalhar o lote, peso, volume ou especificação."
            title="Atributos técnicos"
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
                    <Select {...form.register(`attributes.${index}.attributeLabel`)}>
                      <option value="">Selecione um rótulo</option>
                      {ATTRIBUTE_LABEL_OPTIONS.map((labelOption) => (
                        <option key={labelOption} value={labelOption}>
                          {labelOption}
                        </option>
                      ))}
                    </Select>
                    {form.formState.errors.attributes?.[index]?.attributeLabel ? (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.attributes[index]?.attributeLabel?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Valor</label>
                    <Input
                      placeholder={
                        ATTRIBUTE_VALUE_PLACEHOLDERS[
                          form.watch(`attributes.${index}.attributeLabel`)?.trim() ?? ''
                        ] ?? 'Ex.: informe o valor técnico'
                      }
                      {...form.register(`attributes.${index}.attributeValue`)}
                    />
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
                    Recomendado: proporção 4:3 (ex.: 1600x1200) para melhor encaixe no catálogo.
                  </p>
                </div>
                <input accept="image/*" className="hidden" multiple onChange={handleFileSelection} type="file" />
              </label>

              {orderedImageItems.length === 0 ? (
                <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-900">Nenhuma imagem pronta</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Adicione imagens no bloco acima e organize a ordem antes de enviar para revisão.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {orderedImageItems.map((item, index) => {
                    const isCover = resolvedCoverImageKey === item.key
                    const isDragging = draggingImageKey === item.key

                    return (
                      <div
                        key={item.key}
                        onDrop={handleImageDrop}
                        className={cn(
                          'overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition',
                          isCover ? 'border-primary/60 ring-2 ring-primary/35' : undefined,
                          isDragging ? 'scale-[0.99] opacity-60 ring-2 ring-dashed ring-primary/50' : undefined,
                        )}
                      >
                        <div className="p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                              <GripVertical className="size-3" />
                              Arraste
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                              Reordenar
                            </span>
                          </div>
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
                            <div className="flex flex-wrap gap-2">
                              <button
                                aria-label="Arrastar para reordenar"
                                className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium text-foreground transition hover:bg-secondary active:cursor-grabbing"
                                draggable
                                onDragEnd={handleImageDragEnd}
                                onDragEnter={(event) => handleImageDragOver(event, item.key)}
                                onDragOver={(event) => handleImageDragOver(event, item.key)}
                                onDragStart={(event) => handleImageDragStart(event, item.key)}
                                type="button"
                              >
                                <GripVertical className="size-3" />
                                Segurar e arrastar
                              </button>
                              <Button
                                className="h-auto max-w-full rounded-full px-2.5 py-1 text-center text-[11px] font-medium leading-tight whitespace-normal"
                                onClick={() => setCoverImageKey(item.key)}
                                size="sm"
                                type="button"
                                variant={isCover ? 'default' : 'outline'}
                              >
                                <Star className="size-3 shrink-0" />
                                <span className="min-w-0">{isCover ? 'Capa' : 'Definir capa'}</span>
                              </Button>
                              <Button
                                className="h-7 rounded-full px-2.5 text-[11px] font-medium"
                                onClick={() =>
                                  item.kind === 'existing'
                                    ? removeExistingImage(item.image.id)
                                    : removePendingFile(item.item.clientId)
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <Trash2 className="size-3" />
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

      {feedback ? <DashboardAlertCard description={feedback} title="Ajuste necessário" tone="error" /> : null}

          <DashboardFormSection description={resolvedFinalActionDescription} title="Publicação">
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
              <p className="text-xs leading-6 text-muted-foreground">
                Mesmo que o anúncio já esteja aprovado, toda edição enviada novamente passará por uma nova revisão de moderação.
              </p>
              {!canSubmitForReview ? (
                <DashboardAlertCard
                  description="Adicione fotos do lote antes de enviar para revisão."
                  title="Ainda faltam imagens"
                  tone="warning"
                />
              ) : null}
            </div>
          </DashboardFormSection>
        </div>
      </div>

      <SuccessNoticeDialog
        actionLabel={successNotice?.actionLabel ?? 'Continuar'}
        description={successNotice?.description ?? ''}
        onAction={() => {
          const redirectTo = successNotice?.redirectTo ?? null
          setSuccessNotice(null)

          if (redirectTo) {
            navigate(redirectTo, { replace: true })
          }
        }}
        open={Boolean(successNotice)}
        title={successNotice?.title ?? 'Anúncio salvo com sucesso'}
      />
    </form>
  )
}
