import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AdminListingCategory } from '@/domains/categories/types'
import { buildCategoryTree, collectCategoryAndDescendantIds } from '@/domains/categories/utils'
import {
  adminCategoryFormSchema,
  type AdminCategoryFormValues,
} from '@/domains/categories/schemas'

type AdminCategoryFormProps = {
  categories: AdminListingCategory[]
  currentCategoryId?: string | null
  defaultValues: AdminCategoryFormValues
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (values: AdminCategoryFormValues) => void
  submitLabel: string
}

export function AdminCategoryForm({
  categories,
  currentCategoryId,
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: AdminCategoryFormProps) {
  const tree = buildCategoryTree(categories)
  const excludedCategoryIds = currentCategoryId
    ? new Set(collectCategoryAndDescendantIds(tree, currentCategoryId))
    : new Set<string>()

  const parentOptions = categories.filter(
    (category) => category.id !== currentCategoryId && !excludedCategoryIds.has(category.id),
  )

  const form = useForm<AdminCategoryFormValues>({
    defaultValues,
    resolver: zodResolver(adminCategoryFormSchema),
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categoria operacional</CardTitle>
        <CardDescription>
          Crie, ajuste ou inative categorias que organizam o catálogo e as páginas públicas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-name">
              Nome
            </label>
            <Input id="category-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-slug">
              Slug
            </label>
            <Input
              id="category-slug"
              {...form.register('slug')}
              placeholder="Opcional. Se vazio, será gerado a partir do nome."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-parent">
              Categoria pai
            </label>
            <Select id="category-parent" {...form.register('parentId')}>
              <option value="">Categoria raiz</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.pathLabel}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para criar uma categoria principal. Subcategorias herdam a navegação da categoria pai.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="category-description">
              Descrição
            </label>
            <Textarea
              id="category-description"
              {...form.register('description')}
              className="min-h-28"
              placeholder="Resumo curto da categoria para apoio interno e páginas públicas."
            />
          </div>

          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
            <input className="size-4" type="checkbox" {...form.register('isActive')} />
            Categoria ativa
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
