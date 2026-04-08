import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  manualSnapshotFormSchema,
  type ManualSnapshotFormValues,
} from '@/domains/pricing/schemas'
import { pricingSeriesCatalog } from '@/domains/pricing/utils'

type PricingManualSnapshotFormProps = {
  defaultValues: ManualSnapshotFormValues
  isPending?: boolean
  onSubmit: (values: ManualSnapshotFormValues) => void
}

export function PricingManualSnapshotForm({
  defaultValues,
  isPending,
  onSubmit,
}: PricingManualSnapshotFormProps) {
  const form = useForm<ManualSnapshotFormValues>({
    defaultValues,
    resolver: zodResolver(manualSnapshotFormSchema),
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lancamento manual de snapshot</CardTitle>
        <CardDescription>
          Use esse formulario como contingencia quando o provider publico falhar. O registro respeita
          a mesma tabela historica usada pelo sincronismo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="snapshot-date">
                Data da cotacao
              </label>
              <Input id="snapshot-date" type="date" {...form.register('quotedDate')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="snapshot-provider">
                Provider
              </label>
              <Input id="snapshot-provider" {...form.register('providerName')} placeholder="manual_admin" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pricingSeriesCatalog.map((series) => (
              <div key={series.code} className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor={`snapshot-${series.code}`}>
                  {series.label}
                </label>
                <Input
                  id={`snapshot-${series.code}`}
                  {...form.register(`values.${series.code}`)}
                  placeholder={series.code === 'USD' ? '5,10' : '12345,00'}
                />
              </div>
            ))}
          </div>

          <Button disabled={isPending} type="submit">
            {isPending ? 'Salvando snapshot...' : 'Salvar snapshot manual'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
