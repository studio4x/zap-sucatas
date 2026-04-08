import { z } from 'zod'

export const publicQuestionSchema = z.object({
  guestEmail: z.string().trim().email('Informe um e-mail valido.').optional().or(z.literal('')),
  guestName: z.string().trim().min(2, 'Informe seu nome.').optional().or(z.literal('')),
  questionText: z.string().trim().min(10, 'A pergunta precisa ter pelo menos 10 caracteres.'),
})

export const answerQuestionSchema = z.object({
  answerText: z.string().trim().min(2, 'A resposta precisa ter pelo menos 2 caracteres.'),
})

export type PublicQuestionSchemaValues = z.infer<typeof publicQuestionSchema>
export type AnswerQuestionSchemaValues = z.infer<typeof answerQuestionSchema>
