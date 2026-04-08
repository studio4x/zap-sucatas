import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  scrapPriceEntryFormSchema,
  type ScrapPriceEntryFormValues,
} from '@/domains/pricing/schemas'

type PricingManualPriceFormProps = {
  defaultValues: ScrapPriceEntryFormValues
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (values: ScrapPriceEntryFormValues) => void
  submitLabel: string
}

export function PricingManualPriceForm({
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: PricingManualPriceFormProps) {
  const form = useForm<ScrapPriceEntryFormValues>({
    defaultValues,
    resolver: zodResolver(scrapPriceEntryFormSchema),
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preco manual de sucata</CardTitle>
        <CardDescription>
          Cadastre entradas públicas por material, região e vigência. Esse bloco alimenta a tabela
          comercial exibida ao mercado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-material">
              Material
            </label>
            <Input id="manual-material" {...form.register('materialName')} />
            {form.formState.errors.materialName ? (
              <p className="text-sm text-destructive">{form.formState.errors.materialName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-region">
              Regiao
            </label>
            <Input id="manual-region" {...form.register('regionName')} placeholder="Brasil, Sudeste, SP..." />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-label">
              Rotulo comercial
            </label>
            <Input id="manual-label" {...form.register('priceLabel')} placeholder="Ex.: sob consulta, R$ 1,20/kg" />
            {form.formState.errors.priceLabel ? (
              <p className="text-sm text-destructive">{form.formState.errors.priceLabel.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-price">
              Preco numerico
            </label>
            <Input id="manual-price" {...form.register('priceNumeric')} placeholder="Ex.: 1,25" />
            {form.formState.errors.priceNumeric ? (
              <p className="text-sm text-destructive">{form.formState.errors.priceNumeric.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-unit">
              Unidade
            </label>
            <Input id="manual-unit" {...form.register('priceUnit')} placeholder="kg, tonelada, unidade" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="manual-date">
              Vigencia
            </label>
            <Input id="manual-date" type="date" {...form.register('effectiveDate')} />
            {form.formState.errors.effectiveDate ? (
              <p className="text-sm text-destructive">{form.formState.errors.effectiveDate.message}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
            <input className="size-4" type="checkbox" {...form.register('isActive')} />
            Entrada pública ativa
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? 'Salvando...' : submitLabel}
            </Button>
            {onCancel ? (
              <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
