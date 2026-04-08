import type { ListingQuestion, QuestionStatus } from '@/domains/questions/types'

export const questionStatusOptions: Array<{ label: string; value: QuestionStatus | 'all' }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Publicadas', value: 'published' },
  { label: 'Ocultas', value: 'hidden' },
  { label: 'Bloqueadas', value: 'blocked' },
]

export function formatQuestionDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getQuestionAuthorLabel(question: ListingQuestion) {
  if (question.guestName?.trim()) {
    return question.guestName
  }

  if (question.guestEmail?.trim()) {
    return question.guestEmail
  }

  return question.authorUserId ? 'Usuario autenticado' : 'Visitante'
}
