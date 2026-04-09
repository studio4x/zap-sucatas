import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  adminMaterialFormSchema,
  type AdminMaterialFormValues,
} from '@/domains/categories/schemas'

type AdminMaterialFormProps = {
  defaultValues: AdminMaterialFormValues
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (values: AdminMaterialFormValues) => void
  submitLabel: string
}

export function AdminMaterialForm({
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: AdminMaterialFormProps) {
  const form = useForm<AdminMaterialFormValues>({
    defaultValues,
    resolver: zodResolver(adminMaterialFormSchema),
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material operacional</CardTitle>
        <CardDescription>
          Mantenha a base de materiais coerente com anúncios, filtros e referências comerciais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="material-name">
              Nome
            </label>
            <Input id="material-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="material-slug">
              Slug
            </label>
            <Input
              id="material-slug"
              {...form.register('slug')}
              placeholder="Opcional. Se vazio, será gerado a partir do nome."
            />
          </div>

          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
            <input className="size-4" type="checkbox" {...form.register('isActive')} />
            Material ativo
          </label>

          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? 'Salvando...' : submitLabel}
            </Button>
            {onCancel ? (
              <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
