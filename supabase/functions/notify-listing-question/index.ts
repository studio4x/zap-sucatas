/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type RequestBody = {
  questionId?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const payload = (await request.json()) as RequestBody
    const questionId = typeof payload.questionId === 'string' ? payload.questionId.trim() : ''

    if (!questionId) {
      return jsonResponse({ error: 'questionId e obrigatorio.' }, 400)
    }

    const admin = createAdminClient()
    const { data: question, error: questionError } = await admin
      .from('listing_questions')
      .select('id, listing_id, author_user_id')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return jsonResponse({ error: 'Pergunta nao encontrada.' }, 404)
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, title, user_id')
      .eq('id', question.listing_id)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Anuncio nao encontrado.' }, 404)
    }

    if (question.author_user_id && question.author_user_id === listing.user_id) {
      return jsonResponse({ queuedCount: 0, success: true })
    }

    const result = await enqueueTransactionalNotification({
      actionUrl: '/app/perguntas',
      body: `Seu anuncio "${listing.title}" recebeu uma nova pergunta.`,
      category: 'listing_questions',
      payload: {
        entity_type: 'listing_question',
        listing_id: listing.id,
        question_id: question.id,
      },
      priority: 'normal',
      title: 'Nova pergunta em anuncio',
      userId: listing.user_id,
    })

    await insertIntegrationLog({
      integrationName: 'listing_questions',
      message: 'Notificacao de nova pergunta enfileirada.',
      payload: {
        listingId: listing.id,
        notificationId: result.notificationId,
        questionId: question.id,
        queuedCount: result.queuedCount,
      },
      status: 'queued',
    })

    return jsonResponse({ queuedCount: result.queuedCount, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'

    await insertIntegrationLog({
      integrationName: 'listing_questions',
      message,
      payload: { event: 'notify_listing_question_failed' },
      status: 'error',
    })

    return jsonResponse({ error: message }, 400)
  }
})
