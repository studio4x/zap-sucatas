export type QuestionStatus = 'blocked' | 'hidden' | 'published'

export type ListingQuestion = {
  answer: ListingAnswer | null
  authorUserId: string | null
  createdAt: string
  guestEmail: string | null
  guestName: string | null
  id: string
  listingSlug: string | null
  listingStatus:
    | 'approved'
    | 'archived'
    | 'draft'
    | 'expired'
    | 'paused'
    | 'pending_review'
    | 'rejected'
    | null
  listingTitle: string | null
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

export type PublicQuestionSettings = {
  allowGuestQuestions: boolean
}

export type CreateQuestionInput = {
  guestEmail?: string
  guestName?: string
  listingId: string
  profileId?: string
  questionText: string
}

export type AnswerQuestionInput = {
  answerText?: string
  questionId: string
  questionStatus?: QuestionStatus
}
