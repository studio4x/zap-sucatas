import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { blogPostSchema, type BlogPostFormValues } from '@/domains/blog/schemas'
import type { AdminBlogCategory, AdminBlogPost } from '@/domains/blog/types'

type AdminBlogPostFormProps = {
  categories: AdminBlogCategory[]
  defaultValues: BlogPostFormValues
  existingPost?: AdminBlogPost | null
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (values: BlogPostFormValues, coverFile: File | null) => void
  submitLabel: string
}

export function AdminBlogPostForm({
  categories,
  defaultValues,
  existingPost,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: AdminBlogPostFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const form = useForm<BlogPostFormValues>({
    defaultValues,
    resolver: zodResolver(blogPostSchema),
  })
  const contentValue = form.watch('contentText')

  const toEditorHtml = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('')
  }

  const fromEditorHtmlToPlainText = (html: string) => {
    const container = document.createElement('div')
    container.innerHTML = html
    const blocks = Array.from(container.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6'))
      .map((block) => block.textContent?.trim() ?? '')
      .filter(Boolean)

    if (blocks.length > 0) {
      return blocks.join('\n\n').trim()
    }

    return (container.textContent ?? '').trim()
  }

  const applyEditorCommand = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command)
    if (editorRef.current) {
      form.setValue('contentText', fromEditorHtmlToPlainText(editorRef.current.innerHTML), { shouldValidate: true })
    }
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML.trim().length === 0 && contentValue) {
      editorRef.current.innerHTML = toEditorHtml(contentValue)
    }
  }, [contentValue])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingPost ? 'Editar post' : 'Novo post'}</CardTitle>
        <CardDescription>
          Trabalhe titulo, resumo, categoria, tags, SEO e publicacao no mesmo fluxo operacional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => onSubmit(values, coverFile))}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-title">
                Titulo
              </label>
              <Input id="blog-post-title" {...form.register('title')} placeholder="Titulo editorial do artigo" />
              {form.formState.errors.title ? (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-category">
                Categoria
              </label>
              <Select id="blog-post-category" {...form.register('categoryId')}>
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-status">
                Status
              </label>
              <Select id="blog-post-status" {...form.register('status')}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-slug">
                Slug
              </label>
              <Input
                id="blog-post-slug"
                {...form.register('slug')}
                placeholder="Opcional. Se vazio, sera gerado a partir do titulo."
              />
              {form.formState.errors.slug ? (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-excerpt">
                Resumo
              </label>
              <Textarea
                className="min-h-24"
                id="blog-post-excerpt"
                placeholder="Resumo curto para cards, listagem publica e SEO social."
                {...form.register('excerpt')}
              />
              {form.formState.errors.excerpt ? (
                <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-tags">
                Tags editoriais
              </label>
              <Input
                id="blog-post-tags"
                placeholder="Ex.: cobre, reciclavel, mercado industrial"
                {...form.register('tagsText')}
              />
              <p className="text-xs text-muted-foreground">
                Separe as tags por virgula para melhorar descoberta e relacionados.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-content">
                Conteudo
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-background p-2">
                  <Button onClick={() => applyEditorCommand('bold')} size="sm" type="button" variant="outline">Negrito</Button>
                  <Button onClick={() => applyEditorCommand('italic')} size="sm" type="button" variant="outline">Italico</Button>
                  <Button onClick={() => applyEditorCommand('underline')} size="sm" type="button" variant="outline">Sublinhado</Button>
                  <Button onClick={() => applyEditorCommand('insertUnorderedList')} size="sm" type="button" variant="outline">Lista</Button>
                </div>
                <div
                  ref={editorRef}
                  className="min-h-72 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  contentEditable
                  id="blog-post-content"
                  onBlur={() => {
                    if (editorRef.current) {
                      form.setValue('contentText', fromEditorHtmlToPlainText(editorRef.current.innerHTML), { shouldValidate: true })
                    }
                  }}
                  onInput={() => {
                    if (editorRef.current) {
                      form.setValue('contentText', fromEditorHtmlToPlainText(editorRef.current.innerHTML), { shouldValidate: true })
                    }
                  }}
                  suppressContentEditableWarning
                />
                <input type="hidden" {...form.register('contentText')} />
              </div>
              {form.formState.errors.contentText ? (
                <p className="text-sm text-destructive">{form.formState.errors.contentText.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-seo-title">
                SEO title
              </label>
              <Input id="blog-post-seo-title" placeholder="Opcional" {...form.register('seoTitle')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-seo-description">
                SEO description
              </label>
              <Textarea
                className="min-h-24"
                id="blog-post-seo-description"
                placeholder="Opcional"
                {...form.register('seoDescription')}
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="blog-post-cover">
                Capa
              </label>
              {existingPost?.coverImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                  <img
                    alt={`Capa do post ${existingPost.title}`}
                    className="h-52 w-full object-cover"
                    src={existingPost.coverImageUrl}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Nenhuma capa enviada para este post.
                </div>
              )}
              <Input
                accept="image/*"
                id="blog-post-cover"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <p className="text-xs text-muted-foreground">
                {coverFile
                  ? `Arquivo selecionado: ${coverFile.name}`
                  : 'Envie uma imagem apenas se quiser criar ou substituir a capa atual.'}
              </p>
            </div>
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
