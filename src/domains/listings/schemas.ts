import { z } from 'zod'

export const listingAttributeSchema = z.object({
  attributeLabel: z.string().trim().min(1, 'Informe o nome do atributo.'),
  attributeValue: z.string().trim().min(1, 'Informe o valor do atributo.'),
})

export const listingFormSchema = z.object({
  attributes: z.array(listingAttributeSchema).max(12, 'Limite de 12 atributos.'),
  categoryId: z.string().trim().min(1, 'Selecione uma categoria.'),
  city: z.string().trim().min(2, 'Informe a cidade.'),
  conditionType: z.string().trim(),
  contactName: z.string().trim(),
  contactPhone: z.string().trim(),
  description: z.string().trim().min(20, 'A descricao precisa ter pelo menos 20 caracteres.'),
  priceLabel: z.string().trim(),
  primaryMaterialId: z.string().trim(),
  state: z.string().trim().min(2, 'Informe o estado.'),
  summary: z.string().trim().max(240, 'Resumo com no maximo 240 caracteres.'),
  title: z.string().trim().min(5, 'Informe um titulo mais descritivo.'),
})

export type ListingFormSchemaValues = z.infer<typeof listingFormSchema>
