import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
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

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessao invalida. Faca login novamente.')
    }

    return session.access_token
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token ?? session.access_token

  if (!accessToken) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  return accessToken
}

function normalizeQuestionInsertError(message: string) {
  if (message.includes('Guest name is required')) {
    return 'Informe seu nome para enviar a pergunta sem login.'
  }

  if (message.includes('valid guest email')) {
    return 'Informe um e-mail valido para enviar a pergunta sem login.'
  }

  return message
}

async function invokeQuestionFunction<TBody extends object, TResponse>(name: string, body: TBody) {
  ensureSupabase()

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  const accessToken = await getFreshAccessToken()
  const response = await fetch(`${env.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({
      ...body,
      access_token: accessToken,
    }),
  })

  if (!response.ok) {
    try {
      const payload = (await response.json()) as { error?: string }

      if (payload.error) {
        throw new Error(payload.error)
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) {
        throw parseError
      }
    }

    throw new Error('Edge Function returned a non-2xx status code')
  }

  return (await response.json()) as TResponse
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

async function fetchListingIdsMatchingQuestionSearch(search: string) {
  const { data, error } = await ensureSupabase()
    .from('listings')
    .select('id')
    .ilike('title', search)
    .limit(100)

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) => row.id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
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

export async function fetchAdminQuestionStats() {
  const client = ensureSupabase()
  const [
    { count: totalCount, error: totalError },
    { count: publishedCount, error: publishedError },
    { count: hiddenCount, error: hiddenError },
    { count: blockedCount, error: blockedError },
  ] = await Promise.all([
    client.from('listing_questions').select('id', { count: 'exact', head: true }),
    client.from('listing_questions').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('listing_questions').select('id', { count: 'exact', head: true }).eq('status', 'hidden'),
    client.from('listing_questions').select('id', { count: 'exact', head: true }).eq('status', 'blocked'),
  ])

  if (totalError || publishedError || hiddenError || blockedError) {
    throw totalError ?? publishedError ?? hiddenError ?? blockedError ?? new Error('Falha ao carregar os indicadores.')
  }

  return {
    blocked: blockedCount ?? 0,
    hidden: hiddenCount ?? 0,
    published: publishedCount ?? 0,
    total: totalCount ?? 0,
  }
}

export async function fetchAdminQuestionsPage(input: {
  page: number
  pageSize: number
  query?: string
  status?: 'all' | QuestionStatus
}): Promise<PaginatedResult<ListingQuestion>> {
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = ensureSupabase().from('listing_questions').select(
    `
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
    `,
    { count: 'exact' },
  )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    const listingIds = await fetchListingIdsMatchingQuestionSearch(search)
    const orConditions = [
      `question_text.ilike.${search}`,
      `guest_name.ilike.${search}`,
      `guest_email.ilike.${search}`,
      ...(listingIds.length > 0 ? [`listing_id.in.(${listingIds.join(',')})`] : []),
    ]

    query = query.or(orConditions.join(','))
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    items: (data ?? []).map((row) => mapQuestion(row as unknown as QuestionRow)),
    totalCount: count ?? 0,
  }
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
    const message = error?.message
      ? normalizeQuestionInsertError(error.message)
      : 'Falha ao enviar a pergunta.'
    throw new Error(message)
  }

  try {
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return data.id as string
    }

    await fetch(`${env.supabaseUrl}/functions/v1/notify-listing-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.supabaseAnonKey,
      },
      body: JSON.stringify({
        questionId: data.id,
      }),
    })
  } catch {
    // Notificacao de pergunta nao deve bloquear o envio da pergunta.
  }

  return data.id as string
}

export async function answerListingQuestion(input: AnswerQuestionInput) {
  return invokeQuestionFunction<
    AnswerQuestionInput,
    { questionId: string; questionStatus: QuestionStatus; success: boolean }
  >('answer-listing-question', input)
}

export async function updateQuestionStatus(input: { questionId: string; questionStatus: QuestionStatus }) {
  return invokeQuestionFunction<
    { questionId: string; questionStatus: QuestionStatus },
    { questionId: string; questionStatus: QuestionStatus; success: boolean }
  >('moderate-listing-question', input)
}
