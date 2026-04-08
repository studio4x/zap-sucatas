import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Trash2 } from 'lucide-react'
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

export type ListingEditorSubmitPayload = {
  coverImageId: string | null
  newFiles: File[]
  removedImages: ListingImage[]
  submitAfterSave: boolean
  values: ListingFormValues
}

type ListingEditorProps = {
  cancelTo: string
  categories: ListingCategory[]
  defaultValues: ListingFormValues
  existingImages?: ListingImage[]
  isSubmitting?: boolean
  materials: ListingMaterial[]
  mode: 'create' | 'edit'
  onSubmit: (payload: ListingEditorSubmitPayload) => Promise<void>
  rejectionReason?: string | null
  status?: ListingStatus | null
}

type PendingFile = {
  file: File
  previewUrl: string
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

export function ListingEditor({
  cancelTo,
  categories,
  defaultValues,
  existingImages = [],
  isSubmitting = false,
  materials,
  mode,
  onSubmit,
  rejectionReason,
  status,
}: ListingEditorProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [coverImageId, setCoverImageId] = useState<string | null>(existingImages.find((image) => image.isCover)?.id ?? null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitAfterSave, setSubmitAfterSave] = useState(false)

  const form = useForm<ListingFormSchemaValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues,
  })

  const attributesFieldArray = useFieldArray({
    control: form.control,
    name: 'attributes',
  })

  useEffect(() => {
    form.reset(defaultValues)
    setPendingFiles([])
    setRemovedImageIds([])
    setCoverImageId(existingImages.find((image) => image.isCover)?.id ?? null)
    setFeedback(null)
  }, [defaultValues, existingImages, form])

  useEffect(() => {
    return () => {
      pendingFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl))
    }
  }, [pendingFiles])

  const activeExistingImages = useMemo(
    () => existingImages.filter((image) => !removedImageIds.includes(image.id)),
    [existingImages, removedImageIds],
  )

  async function handleSubmit(values: ListingFormSchemaValues, shouldSubmitAfterSave: boolean) {
    try {
      setFeedback(null)
      setSubmitAfterSave(shouldSubmitAfterSave)
      await onSubmit({
        coverImageId,
        newFiles: pendingFiles.map((file) => file.file),
        removedImages: existingImages.filter((image) => removedImageIds.includes(image.id)),
        submitAfterSave: shouldSubmitAfterSave,
        values: {
          ...values,
          attributes: values.attributes ?? [],
        },
      })

      pendingFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl))
      setPendingFiles([])
      setRemovedImageIds([])
      setSubmitAfterSave(false)
      if (!shouldSubmitAfterSave) {
        setFeedback('Rascunho salvo com sucesso.')
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Falha ao salvar o anuncio.')
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
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])

    event.target.value = ''
  }

  function removePendingFile(index: number) {
    setPendingFiles((current) => {
      const next = [...current]
      const removed = next.splice(index, 1)[0]

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      return next
    })
  }

  function toggleRemoveExistingImage(imageId: string) {
    setRemovedImageIds((current) => {
      if (current.includes(imageId)) {
        return current.filter((id) => id !== imageId)
      }

      if (coverImageId === imageId) {
        setCoverImageId(null)
      }

      return [...current, imageId]
    })
  }

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
        description="Preencha os dados do lote, revise fotos e escolha se quer apenas salvar ou enviar para moderacao."
        title={mode === 'create' ? 'Criar anuncio' : 'Editar anuncio'}
      />

      {rejectionReason ? (
        <DashboardAlertCard
          description={rejectionReason}
          title="Motivo da rejeicao anterior"
          tone="warning"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <DashboardFormSection
            description="Esses campos entram no card do catalogo e na validacao da moderacao."
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
                    <option value="">Nao informado</option>
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
            description="Dados usados no detalhe do anuncio e no filtro geografico do catalogo."
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
                <Input {...form.register('conditionType')} placeholder="Ex.: usado, em lote, sucata prensada" />
              </FormField>

              <FormField label="Faixa de preco">
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
                <div key={field.id} className="grid gap-3 rounded-3xl border border-border/70 p-4 md:grid-cols-[1fr_1fr_auto]">
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
            description="O anuncio precisa de ao menos uma imagem para ser enviado para revisao."
            title="Imagens"
          >
            <div className="space-y-4">
              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-5 py-8 text-center transition hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                <ImagePlus className="size-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Selecionar imagens</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP. Voce pode escolher varias imagens de uma vez.
                  </p>
                </div>
                <input accept="image/*" className="hidden" multiple onChange={handleFileSelection} type="file" />
              </label>

              {activeExistingImages.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Imagens atuais</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeExistingImages.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-2xl border border-border/70">
                        <div className="aspect-square bg-muted">
                          <img alt={image.altText ?? 'Imagem do anuncio'} className="h-full w-full object-cover" src={image.publicUrl} />
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => setCoverImageId(image.id)}
                              size="sm"
                              type="button"
                              variant={coverImageId === image.id ? 'default' : 'outline'}
                            >
                              {coverImageId === image.id ? 'Capa selecionada' : 'Definir capa'}
                            </Button>
                            <Button
                              onClick={() => toggleRemoveExistingImage(image.id)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {pendingFiles.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Novas imagens para upload</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pendingFiles.map((item, index) => (
                      <div key={`${item.file.name}-${index}`} className="overflow-hidden rounded-2xl border border-border/70">
                        <div className="aspect-square bg-muted">
                          <img alt={item.file.name} className="h-full w-full object-cover" src={item.previewUrl} />
                        </div>
                        <div className="space-y-2 p-4">
                          <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                          <Button onClick={() => removePendingFile(index)} size="sm" type="button" variant="outline">
                            Remover da fila
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
            <DashboardAlertCard description={feedback} title="Ajuste necessario" tone="error" />
          ) : null}

          <DashboardFormSection
            description="Salve quantas vezes precisar. Quando os dados estiverem completos, envie para revisao."
            title="Publicacao"
          >
            <div className="space-y-3">
              <Button
                disabled={isSubmitting}
                onClick={() => void form.handleSubmit((values) => handleSubmit(values, false))()}
                type="button"
                variant="outline"
              >
                {isSubmitting && !submitAfterSave ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => void form.handleSubmit((values) => handleSubmit(values, true))()}
                type="button"
              >
                {isSubmitting && submitAfterSave ? 'Enviando...' : 'Salvar e enviar para revisao'}
              </Button>
              {activeExistingImages.length === 0 && pendingFiles.length === 0 ? (
                <DashboardEmptyState
                  className="px-4 py-8"
                  description="Adicione fotos do lote antes de enviar para revisao."
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
