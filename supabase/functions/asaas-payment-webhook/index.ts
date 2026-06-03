/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type AsaasWebhookPayload = {
  event?: string
  payment?: {
    id?: string
    status?: string
  }
}

type FeaturedPaymentStatus = 'canceled' | 'expired' | 'failed' | 'paid' | 'pending'

const PAID_STATUSES = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'])
const EXPIRED_STATUSES = new Set(['OVERDUE'])
const CANCELED_STATUSES = new Set(['DELETED'])
const FAILED_STATUSES = new Set([
  'REFUNDED',
  'REFUND_REQUESTED',
  'CHARGEBACK_DISPUTE',
  'AWAITING_CHARGEBACK_REVERSAL',
])

function resolveWebhookStatus(asaasStatus: string): FeaturedPaymentStatus {
  if (PAID_STATUSES.has(asaasStatus)) {
    return 'paid'
  }

  if (EXPIRED_STATUSES.has(asaasStatus)) {
    return 'expired'
  }

  if (CANCELED_STATUSES.has(asaasStatus)) {
    return 'canceled'
  }

  if (FAILED_STATUSES.has(asaasStatus)) {
    return 'failed'
  }

  return 'pending'
}

function isWebhookTokenValid(request: Request) {
  const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')?.trim()

  if (!expectedToken) {
    return true
  }

  const receivedToken =
    request.headers.get('asaas-access-token')?.trim() ||
    request.headers.get('asaas_access_token')?.trim() ||
    ''

  return receivedToken.length > 0 && receivedToken === expectedToken
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  if (!isWebhookTokenValid(request)) {
    return jsonResponse({ error: 'Token de webhook inválido.' }, 401)
  }

  try {
    const payload = (await request.json()) as AsaasWebhookPayload
    const asaasPaymentId = payload.payment?.id?.trim()
    const asaasStatus = payload.payment?.status?.trim().toUpperCase()

    if (!asaasPaymentId || !asaasStatus) {
      return jsonResponse({ error: 'Payload inválido.' }, 400)
    }

    const admin = createAdminClient()
    const { data: featuredPayment, error: featuredPaymentError } = await admin
      .from('listing_featured_payments')
      .select('id, listing_id, status, user_id')
      .eq('asaas_payment_id', asaasPaymentId)
      .maybeSingle()

    if (featuredPaymentError) {
      throw featuredPaymentError
    }

    if (!featuredPayment) {
      await insertIntegrationLog({
        integrationName: 'asaas',
        message: 'Webhook received for unknown payment id.',
        payload,
        status: 'warning',
      })

      return jsonResponse({ ignored: true, success: true })
    }

    const nextStatus = resolveWebhookStatus(asaasStatus)
    const updatePayload: Record<string, unknown> = {
      metadata: {
        asaasEvent: payload.event ?? null,
        asaasStatus,
      },
      status: nextStatus,
    }

    if (nextStatus === 'paid') {
      updatePayload.paid_at = new Date().toISOString()
    }

    const { error: updatePaymentError } = await admin
      .from('listing_featured_payments')
      .update(updatePayload)
      .eq('id', featuredPayment.id)

    if (updatePaymentError) {
      throw updatePaymentError
    }

    if (nextStatus === 'paid') {
      const { error: listingUpdateError } = await admin
        .from('listings')
        .update({
          is_featured: true,
        })
        .eq('id', featuredPayment.listing_id)

      if (listingUpdateError) {
        throw listingUpdateError
      }
    }
    const paymentStatusCopy: Record<FeaturedPaymentStatus, string> = {
      canceled: 'foi cancelado',
      expired: 'venceu',
      failed: 'falhou',
      paid: 'foi confirmado',
      pending: 'esta pendente',
    }
    await enqueueTransactionalNotification({
      actionUrl: '/app/anuncios',
      body: `O pagamento de destaque ${paymentStatusCopy[nextStatus]}.`,
      category: 'featured_payment',
      title: `Pagamento de destaque: ${nextStatus}`,
      userId: featuredPayment.user_id,
    })

    await insertIntegrationLog({
      integrationName: 'asaas',
      message: 'Featured listing payment webhook processed.',
      payload: {
        asaasPaymentId,
        asaasStatus,
        listingId: featuredPayment.listing_id,
        mappedStatus: nextStatus,
      },
      status: 'success',
    })

    return jsonResponse({ success: true })
  } catch (error) {
    await insertIntegrationLog({
      integrationName: 'asaas',
      message: error instanceof Error ? error.message : 'Unexpected webhook error.',
      payload: null,
      status: 'error',
    })

    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, 500)
  }
})


