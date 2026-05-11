/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type PaymentRow = {
  amount: number
  asaas_invoice_url: string | null
  asaas_payment_id: string
  billing_type: string
  created_at: string
  due_date: string | null
  id: string
  listing_id: string
  listings: {
    slug: string | null
    status: string
    title: string
  } | null
  paid_at: string | null
  profiles: {
    full_name: string | null
  } | null
  status: string
  user_id: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('listing_featured_payments')
      .select(
        `
          id,
          listing_id,
          user_id,
          amount,
          billing_type,
          status,
          asaas_payment_id,
          asaas_invoice_url,
          due_date,
          paid_at,
          created_at,
          listings(title, slug, status),
          profiles(full_name)
        `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const items = ((data ?? []) as PaymentRow[]).map((row) => ({
      amount: row.amount,
      asaasPaymentId: row.asaas_payment_id,
      billingType: row.billing_type,
      createdAt: row.created_at,
      dueDate: row.due_date,
      id: row.id,
      invoiceUrl: row.asaas_invoice_url,
      listing: {
        id: row.listing_id,
        slug: row.listings?.slug ?? null,
        status: row.listings?.status ?? null,
        title: row.listings?.title ?? 'Anúncio removido',
      },
      paidAt: row.paid_at,
      status: row.status,
      user: {
        id: row.user_id,
        name: row.profiles?.full_name ?? 'Sem nome',
      },
    }))

    return jsonResponse({ items, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
