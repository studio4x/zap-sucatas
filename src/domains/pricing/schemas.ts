import { z } from 'zod'

const numericStringSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || !Number.isNaN(Number(value.replace(/\./g, '').replace(',', '.'))), {
    message: 'Informe um numero válido.',
  })

export const scrapPriceEntryFormSchema = z.object({
  effectiveDate: z.string().trim().min(10, 'Informe a data de vigencia.'),
  isActive: z.boolean(),
  materialName: z.string().trim().min(2, 'Informe o material.'),
  priceLabel: z.string().trim().min(2, 'Informe o rotulo comercial do preço.'),
  priceNumeric: numericStringSchema,
  priceUnit: z.string().trim(),
  regionName: z.string().trim(),
})

export type ScrapPriceEntryFormValues = z.infer<typeof scrapPriceEntryFormSchema>

export const manualSnapshotFormSchema = z.object({
  providerName: z.string().trim().min(1, 'Informe o provider manual.'),
  quotedDate: z.string().trim().min(10, 'Informe a data da cotação.'),
  values: z.object({
    AL: numericStringSchema,
    CU: numericStringSchema,
    NI: numericStringSchema,
    PB: numericStringSchema,
    SN: numericStringSchema,
    USD: numericStringSchema,
    ZN: numericStringSchema,
  }),
})

export type ManualSnapshotFormValues = z.infer<typeof manualSnapshotFormSchema>