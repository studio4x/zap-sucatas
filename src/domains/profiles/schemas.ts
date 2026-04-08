import { z } from 'zod'

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
  phone: z.string().trim(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>
