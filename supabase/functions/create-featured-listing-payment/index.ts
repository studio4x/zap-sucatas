/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { asaasRequest, resolveFeaturedBillingType, resolveFeaturedDueDays, resolveFeaturedPriceValue } from '../_shared/asaas.ts'
import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog, insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type RequestBody = {
  listingId?: string
}

type AsaasCustomerResponse = {
  id: string
}

type AsaasCreatePaymentResponse = {
  bankSlipUrl?: string | null
  billingType?: string | null
  dueDate?: string | null
  id: string
  invoiceUrl?: string | null
  status?: string | null
  value?: number | null
}

type AsaasPixQrCodeResponse = {
  encodedImage?: string | null
  expirationDate?: string | null
  payload?: string | null
}

type ListingFeaturedPaymentRow = {
  amount: number
  asaas_bank_slip_url: string | null
  asaas_invoice_url: string | null
  asaas_payment_id: string
  asaas_pix_copy_paste: string | null
  asaas_pix_qr_code: string | null
  billing_type: string
  due_date: string | null
  id: string
  status: string
}

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.length < 10) {
    return null
  }

  return digits.slice(0, 11)
}

function formatDueDate(daysAhead: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysAhead)
  return date.toISOString().slice(0, 10)
}

function formatPaymentResponse(payment: ListingFeaturedPaymentRow) {
  return {
    amount: payment.amount,
    bankSlipUrl: payment.asaas_bank_slip_url,
    billingType: payment.billing_type,
    dueDate: payment.due_date,
    id: payment.id,
    invoiceUrl: payment.asaas_invoice_url,
    isPaid: payment.status === 'paid',
    pixCopyPaste: payment.asaas_pix_copy_paste,
    pixQrCode: payment.asaas_pix_qr_code,
    status: payment.status,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const { listingId } = (await request.json()) as RequestBody

    if (!listingId) {
      return jsonResponse({ error: 'listingId is required.' }, 400)
    }

    const admin = createAdminClient()
    const { data: systemSettings, error: settingsError } = await admin
      .from('system_settings')
      .select('featured_payments_enabled')
      .limit(1)
      .single()

    if (settingsError || !systemSettings) {
      throw settingsError ?? new Error('System settings not found.')
    }

    if (!systemSettings.featured_payments_enabled) {
      return jsonResponse({ error: 'Featured payments are currently disabled.' }, 409)
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, title, status, is_featured, contact_name, contact_phone')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Listing not found.' }, 404)
    }

    if (listing.user_id !== actor.id && actor.role !== 'admin') {
      return jsonResponse({ error: 'You cannot request featured payment for this listing.' }, 403)
    }

    if (listing.status !== 'approved') {
      return jsonResponse({ error: 'Only approved listings can be featured.' }, 409)
    }

    if (listing.is_featured) {
      return jsonResponse({ error: 'Listing is already featured.' }, 409)
    }

    const { data: existingPending, error: existingPendingError } = await admin
      .from('listing_featured_payments')
      .select('id, status, amount, billing_type, due_date, asaas_payment_id, asaas_invoice_url, asaas_bank_slip_url, asaas_pix_qr_code, asaas_pix_copy_paste')
      .eq('listing_id', listingId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPendingError) {
      throw existingPendingError
    }

    if (existingPending) {
      return jsonResponse({
        listingId,
        payment: formatPaymentResponse(existingPending as ListingFeaturedPaymentRow),
        reusedPendingPayment: true,
        success: true,
      })
    }

    const { data: ownerProfile, error: ownerProfileError } = await admin
      .from('profiles')
      .select('id, auth_user_id, full_name')
      .eq('id', listing.user_id)
      .single()

    if (ownerProfileError || !ownerProfile) {
      throw ownerProfileError ?? new Error('Listing owner profile not found.')
    }

    const { data: ownerAuthData, error: ownerAuthError } = await admin.auth.admin.getUserById(ownerProfile.auth_user_id)

    if (ownerAuthError || !ownerAuthData.user) {
      throw ownerAuthError ?? new Error('Listing owner auth user not found.')
    }

    const customerName =
      listing.contact_name?.trim() ||
      ownerProfile.full_name?.trim() ||
      ownerAuthData.user.user_metadata?.full_name?.toString().trim() ||
      'Cliente Zap Sucatas'
    const customerEmail = ownerAuthData.user.email?.trim() || null
    const customerPhone = normalizePhone(listing.contact_phone)

    const customer = await asaasRequest<AsaasCustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        email: customerEmail,
        mobilePhone: customerPhone,
        name: customerName,
      }),
    })

    const billingType = resolveFeaturedBillingType()
    const amount = resolveFeaturedPriceValue()
    const dueDate = formatDueDate(resolveFeaturedDueDays())

    const createdPayment = await asaasRequest<AsaasCreatePaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        billingType,
        customer: customer.id,
        description: `Destaque premium do anúncio "${listing.title}"`,
        dueDate,
        externalReference: listingId,
        value: amount,
      }),
    })

    const asaasPaymentId = createdPayment.id
    const isPix = billingType === 'PIX'
    let pixData: AsaasPixQrCodeResponse | null = null

    if (isPix) {
      pixData = await asaasRequest<AsaasPixQrCodeResponse>(`/payments/${asaasPaymentId}/pixQrCode`)
    }

    const { data: savedPayment, error: saveError } = await admin
      .from('listing_featured_payments')
      .insert({
        amount,
        asaas_bank_slip_url: createdPayment.bankSlipUrl ?? null,
        asaas_customer_id: customer.id,
        asaas_invoice_url: createdPayment.invoiceUrl ?? null,
        asaas_payment_id: asaasPaymentId,
        asaas_pix_copy_paste: pixData?.payload ?? null,
        asaas_pix_qr_code: pixData?.encodedImage ?? null,
        billing_type: billingType,
        due_date: createdPayment.dueDate ?? dueDate,
        expires_at: pixData?.expirationDate ?? null,
        listing_id: listingId,
        metadata: {
          asaasStatus: createdPayment.status ?? 'PENDING',
        },
        status: 'pending',
        user_id: listing.user_id,
      })
      .select('id, status, amount, billing_type, due_date, asaas_payment_id, asaas_invoice_url, asaas_bank_slip_url, asaas_pix_qr_code, asaas_pix_copy_paste')
      .single()

    if (saveError || !savedPayment) {
      throw saveError ?? new Error('Unable to store featured payment.')
    }

    await insertAdminAuditLog({
      action: 'create_listing_featured_payment',
      actorUserId: actor.id,
      afterData: {
        amount,
        asaas_payment_id: asaasPaymentId,
        billing_type: billingType,
        listing_id: listingId,
        status: 'pending',
      },
      entityId: (savedPayment as ListingFeaturedPaymentRow).id,
      entityType: 'listing_featured_payment',
    })

    await insertIntegrationLog({
      integrationName: 'asaas',
      message: 'Featured listing payment created.',
      payload: {
        asaasPaymentId,
        billingType,
        listingId,
      },
      status: 'success',
    })
    await enqueueTransactionalNotification({
      actionUrl: '/app/anuncios',
      body: `A cobrança de destaque do anúncio "${listing.title}" foi criada no valor de R$ ${amount.toFixed(2)}.`,
      category: 'featured_payment',
      title: 'Cobranca de destaque criada',
      userId: listing.user_id,
    })

    return jsonResponse({
      listingId,
      payment: formatPaymentResponse(savedPayment as ListingFeaturedPaymentRow),
      reusedPendingPayment: false,
      success: true,
    })
  } catch (error) {
    await insertIntegrationLog({
      integrationName: 'asaas',
      message: error instanceof Error ? error.message : 'Unexpected featured payment error.',
      payload: null,
      status: 'error',
    })
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})