import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  blogCategorySchema,
  type BlogCategoryFormValues,
} from '@/domains/blog/schemas'

type AdminBlogCategoryFormProps = {
  defaultValues: BlogCategoryFormValues
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (values: BlogCategoryFormValues) => void
  submitLabel: string
}

export function AdminBlogCategoryForm({
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: AdminBlogCategoryFormProps) {
  const form = useForm<BlogCategoryFormValues>({
    defaultValues,
    resolver: zodResolver(blogCategorySchema),
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categoria editorial</CardTitle>
        <CardDescription>
          Organize o blog por temas e mantenha a navegação pública coerente com SEO e descoberta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="blog-category-name">
              Nome
            </label>
            <Input id="blog-category-name" {...form.register('name')} placeholder="Ex.: Mercado do cobre" />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="blog-category-slug">
              Slug
            </label>
            <Input
              id="blog-category-slug"
              {...form.register('slug')}
              placeholder="Opcional. Se vazio, será gerado a partir do nome."
            />
            {form.formState.errors.slug ? (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

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
