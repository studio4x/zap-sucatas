import { z } from 'zod'

export const contactMessageSchema = z.object({
  companyWebsite: z.string().trim(),
  email: z.string().trim().email('Informe um e-mail válido.'),
  fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
  message: z.string().trim().min(10, 'Descreva a mensagem com um pouco mais de detalhe.'),
  phone: z.string().trim(),
  subject: z.string().trim().min(3, 'Informe um assunto objetivo.'),
})

export type ContactMessageValues = z.infer<typeof contactMessageSchema>
