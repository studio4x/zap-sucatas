import { supabase } from '@/integrations/supabase/client'
import type {
  AnswerQuestionInput,
  CreateQuestionInput,
  ListingAnswer,
  ListingQuestion,
  PublicQuestionSettings,
  QuestionStatus,
} from '@/domains/questions/types'

type QuestionRow = {
  author_user_id: string | null
  created_at: string
  guest_email: string | null
  guest_name: string | null
  id: string
  listing_id: string
  question_text: string
  status: QuestionStatus
  updated_at: string
  listing_answers?: AnswerRow[] | null
  listings?: {
    slug: string | null
    status:
      | 'approved'
      | 'archived'
      | 'draft'
      | 'expired'
      | 'paused'
      | 'pending_review'
      | 'rejected'
    title: string
  } | null
}

type AnswerRow = {
  answer_text: string
  created_at: string
  id: string
  question_id: string
  responder_user_id: string
  updated_at: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

function mapAnswer(row: AnswerRow): ListingAnswer {
  return {
    answerText: row.answer_text,
    createdAt: row.created_at,
    id: row.id,
    questionId: row.question_id,
    responderUserId: row.responder_user_id,
    updatedAt: row.updated_at,
  }
}

function mapQuestion(row: QuestionRow): ListingQuestion {
  return {
    answer: row.listing_answers?.[0] ? mapAnswer(row.listing_answers[0]) : null,
    authorUserId: row.author_user_id,
    createdAt: row.created_at,
    guestEmail: row.guest_email,
    guestName: row.guest_name,
    id: row.id,
    listingId: row.listing_id,
    listingSlug: row.listings?.slug ?? null,
    listingStatus: row.listings?.status ?? null,
    listingTitle: row.listings?.title ?? null,
    questionText: row.question_text,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

function buildQuestionsQuery() {
  return ensureSupabase().from('listing_questions').select(`
      id,
      listing_id,
      author_user_id,
      guest_name,
      guest_email,
      question_text,
      status,
      created_at,
      updated_at,
      listing_answers(id, question_id, responder_user_id, answer_text, created_at, updated_at),
      listings!inner(title, slug, status, user_id)
    `)
}

export async function fetchQuestionSettings(): Promise<PublicQuestionSettings> {
  const { data, error } = await ensureSupabase()
    .from('system_settings')
    .select('allow_guest_questions')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return {
    allowGuestQuestions: data?.allow_guest_questions ?? false,
  }
}

export async function fetchPublicQuestionsByListing(listingId: string) {
  const { data, error } = await buildQuestionsQuery()
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapQuestion(row as unknown as QuestionRow))
}

export async function fetchOwnerQuestions(profileId: string) {
  const { data, error } = await buildQuestionsQuery()
    .eq('listings.user_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapQuestion(row as unknown as QuestionRow))
}

export async function fetchAdminQuestions() {
  const { data, error } = await buildQuestionsQuery().order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapQuestion(row as unknown as QuestionRow))
}

export async function createListingQuestion(input: CreateQuestionInput) {
  const payload = {
    author_user_id: input.profileId ?? null,
    guest_email: input.guestEmail?.trim() || null,
    guest_name: input.guestName?.trim() || null,
    listing_id: input.listingId,
    question_text: input.questionText.trim(),
  }

  const { data, error } = await ensureSupabase()
    .from('listing_questions')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Falha ao enviar a pergunta.')
  }

  return data.id as string
}

export async function answerListingQuestion(input: AnswerQuestionInput) {
  const { data, error } = await ensureSupabase().functions.invoke('answer-listing-question', {
    body: input,
  })

  if (error) {
    throw error
  }

  return data as { questionId: string; questionStatus: QuestionStatus; success: boolean }
}

export async function updateQuestionStatus(input: { questionId: string; questionStatus: QuestionStatus }) {
  const { error } = await ensureSupabase()
    .from('listing_questions')
    .update({ status: input.questionStatus })
    .eq('id', input.questionId)

  if (error) {
    throw error
  }
}
