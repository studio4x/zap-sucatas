/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type RequestBody = {
  answerText?: string
  questionId?: string
  questionStatus?: 'blocked' | 'hidden' | 'published'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { answerText, questionId, questionStatus } = (await request.json()) as RequestBody

    if (!questionId || !answerText?.trim()) {
      return jsonResponse({ error: 'questionId and answerText are required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: question, error: questionError } = await admin
      .from('listing_questions')
      .select('id, listing_id, status')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return jsonResponse({ error: 'Question not found.' }, 404)
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id')
      .eq('id', question.listing_id)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (actor.role !== 'admin' && listing.user_id !== actor.id) {
      return jsonResponse({ error: 'You cannot answer this question.' }, 403)
    }

    const nextQuestionStatus =
      actor.role === 'admin'
        ? questionStatus ?? question.status
        : question.status === 'hidden'
          ? 'published'
          : question.status

    const { error: answerError } = await admin.from('listing_answers').upsert(
      {
        question_id: questionId,
        responder_user_id: actor.id,
        answer_text: answerText.trim(),
      },
      { onConflict: 'question_id' },
    )

    if (answerError) {
      throw answerError
    }

    if (nextQuestionStatus !== question.status) {
      const { error: questionUpdateError } = await admin
        .from('listing_questions')
        .update({ status: nextQuestionStatus })
        .eq('id', questionId)

      if (questionUpdateError) {
        throw questionUpdateError
      }
    }

    await insertAdminAuditLog({
      action: 'answer_listing_question',
      actorUserId: actor.id,
      beforeData: { question_status: question.status },
      afterData: { question_status: nextQuestionStatus },
      entityId: questionId,
      entityType: 'listing_question',
    })

    return jsonResponse({
      questionId,
      questionStatus: nextQuestionStatus,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
