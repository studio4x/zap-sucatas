import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
})

export const magicLinkSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
})

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Informe seu nome completo.'),
    email: z.string().email('Informe um e-mail válido.'),
    password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a senha.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'As senhas precisam coincidir.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a senha.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'As senhas precisam coincidir.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type MagicLinkFormValues = z.infer<typeof magicLinkSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>