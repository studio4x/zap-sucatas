/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireActiveProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type ListingFeaturedPaymentSummaryRow = {
  amount: number
  asaas_invoice_url: string | null
  asaas_pix_copy_paste: string | null
  billing_type: string
  created_at: string
  due_date: string | null
  id: string
  listing_id: string
  paid_at: string | null
  status: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireActiveProfile(request)
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('listing_featured_payments')
      .select('id, listing_id, status, amount, billing_type, due_date, paid_at, asaas_invoice_url, asaas_pix_copy_paste, created_at')
      .eq('user_id', actor.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const latestByListing = new Map<string, ListingFeaturedPaymentSummaryRow>()
    ;((data ?? []) as ListingFeaturedPaymentSummaryRow[]).forEach((row) => {
      if (!latestByListing.has(row.listing_id)) {
        latestByListing.set(row.listing_id, row)
      }
    })

    const summaries = Array.from(latestByListing.values()).map((item) => ({
      amount: item.amount,
      billingType: item.billing_type,
      createdAt: item.created_at,
      dueDate: item.due_date,
      id: item.id,
      invoiceUrl: item.asaas_invoice_url,
      isPaid: item.status === 'paid',
      listingId: item.listing_id,
      paidAt: item.paid_at,
      pixCopyPaste: item.asaas_pix_copy_paste,
      status: item.status,
    }))

    return jsonResponse({
      items: summaries,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
