import { z } from 'zod'

export const passwordSettingsSchema = z
  .object({
    confirmPassword: z.string().min(6, 'Confirme a nova senha.'),
    password: z.string().min(6, 'A nova senha precisa ter pelo menos 6 caracteres.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })

export type PasswordSettingsValues = z.infer<typeof passwordSettingsSchema>
