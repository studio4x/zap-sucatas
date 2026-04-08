import { z } from 'zod'

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
  phone: z.string().trim(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

const baseAdminUserSchema = z.object({
  email: z.string().trim().email('Informe um e-mail valido.'),
  fullName: z.string().trim().min(3, 'Informe o nome completo.'),
  phone: z.string().trim(),
  role: z.enum(['admin', 'user']),
  status: z.enum(['active', 'suspended', 'under_review']),
})

export const adminCreateUserSchema = baseAdminUserSchema
  .extend({
    confirmPassword: z.string().min(8, 'Confirme a senha inicial.'),
    password: z.string().min(8, 'A senha inicial precisa ter ao menos 8 caracteres.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })

export const adminUpdateUserSchema = baseAdminUserSchema

export type AdminCreateUserValues = z.infer<typeof adminCreateUserSchema>
export type AdminUpdateUserValues = z.infer<typeof adminUpdateUserSchema>
