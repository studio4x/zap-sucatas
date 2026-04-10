import { z } from 'zod'

export const blogCategorySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da categoria.'),
  slug: z.string().trim(),
})

export const blogPostSchema = z.object({
  categoryId: z.string().trim(),
  contentText: z.string().trim().min(40, 'Escreva um conteudo com pelo menos 40 caracteres.'),
  excerpt: z.string().trim().min(20, 'Informe um resumo com pelo menos 20 caracteres.'),
  seoDescription: z.string().trim(),
  seoTitle: z.string().trim(),
  slug: z.string().trim(),
  status: z.enum(['archived', 'draft', 'published']),
  tagsText: z.string().trim(),
  title: z.string().trim().min(5, 'Informe um titulo com pelo menos 5 caracteres.'),
})

export type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>
export type BlogPostFormValues = z.infer<typeof blogPostSchema>
