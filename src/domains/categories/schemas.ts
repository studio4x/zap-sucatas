import { z } from 'zod'

export const adminCategoryFormSchema = z.object({
  description: z.string().trim(),
  isActive: z.boolean(),
  name: z.string().trim().min(2, 'Informe o nome da categoria.'),
  slug: z.string().trim(),
})

export const adminMaterialFormSchema = z.object({
  isActive: z.boolean(),
  name: z.string().trim().min(2, 'Informe o nome do material.'),
  slug: z.string().trim(),
})

export type AdminCategoryFormValues = z.infer<typeof adminCategoryFormSchema>
export type AdminMaterialFormValues = z.infer<typeof adminMaterialFormSchema>
