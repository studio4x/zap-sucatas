import { z } from 'zod'

export const supportTicketSchema = z.object({
  category: z.enum(['payment', 'technical', 'account', 'general']),
  subject: z.string().min(4, 'Informe um assunto objetivo.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10, 'Descreva o contexto com mais detalhe.'),
})

export const supportMessageSchema = z.object({
  message: z.string().trim().min(1, 'Escreva uma mensagem ou envie um anexo.'),
})

export type SupportMessageFormValues = z.infer<typeof supportMessageSchema>
export type SupportTicketSchemaValues = z.infer<typeof supportTicketSchema>
