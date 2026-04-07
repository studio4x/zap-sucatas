export type QuestionStatus = 'blocked' | 'hidden' | 'published'

export type ListingQuestion = {
  authorUserId: string | null
  createdAt: string
  guestEmail: string | null
  guestName: string | null
  id: string
  listingId: string
  questionText: string
  status: QuestionStatus
  updatedAt: string
}

export type ListingAnswer = {
  answerText: string
  createdAt: string
  id: string
  questionId: string
  responderUserId: string
  updatedAt: string
}
