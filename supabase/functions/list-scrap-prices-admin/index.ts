/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('scrap_price_items')
      .select('id, product_name, price_label, quantity_label, sort_order, is_active, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const items = (data ?? []).map((row) => ({
      createdAt: row.created_at,
      id: row.id,
      isActive: row.is_active,
      priceLabel: row.price_label,
      productName: row.product_name,
      quantityLabel: row.quantity_label,
      sortOrder: row.sort_order,
      updatedAt: row.updated_at,
    }))

    return jsonResponse({ items, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
