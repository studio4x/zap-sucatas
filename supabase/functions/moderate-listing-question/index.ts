/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type QuestionStatus = 'blocked' | 'hidden' | 'published'

type RequestBody = {
  questionId?: string
  questionStatus?: QuestionStatus
}

const allowedStatuses = new Set<QuestionStatus>(['blocked', 'hidden', 'published'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireAdminProfile(request)
    const { questionId, questionStatus } = (await request.json()) as RequestBody

    if (!questionId || !questionStatus) {
      return jsonResponse({ error: 'questionId and questionStatus are required.' }, 400)
    }

    if (!allowedStatuses.has(questionStatus)) {
      return jsonResponse({ error: 'Invalid questionStatus.' }, 400)
    }

    const admin = createAdminClient()
    const { data: question, error: questionError } = await admin
      .from('listing_questions')
      .select('id, listing_id, status, author_user_id')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return jsonResponse({ error: 'Question not found.' }, 404)
    }

    if (question.status === questionStatus) {
      return jsonResponse({
        questionId,
        questionStatus,
        success: true,
      })
    }

    const { error: updateError } = await admin
      .from('listing_questions')
      .update({ status: questionStatus })
      .eq('id', questionId)

    if (updateError) {
      throw updateError
    }

    await insertAdminAuditLog({
      action: 'moderate_listing_question',
      actorUserId: actor.id,
      beforeData: { question_status: question.status },
      afterData: { question_status: questionStatus },
      entityId: questionId,
      entityType: 'listing_question',
    })

    if (question.author_user_id) {
      const statusCopy: Record<QuestionStatus, string> = {
        blocked: 'foi bloqueada pela moderacao',
        hidden: 'foi ocultada temporariamente',
        published: 'foi publicada',
      }

      await enqueueTransactionalNotification({
        actionUrl: '/app/perguntas',
        body: `Sua pergunta ${statusCopy[questionStatus]}.`,
        category: 'listing_questions',
        payload: {
          entity_type: 'listing_question',
          question_id: question.id,
          status: questionStatus,
        },
        priority: 'normal',
        title: 'Atualizacao na moderacao da sua pergunta',
        userId: question.author_user_id,
      })
    }

    return jsonResponse({
      questionId,
      questionStatus,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
