/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type Payload = {
  id?: string
  isActive?: boolean
  priceLabel?: string
  productName?: string
  quantityLabel?: string
  sortOrder?: number
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const payload = (await request.json()) as Payload
    const productName = payload.productName?.trim() ?? ''
    const priceLabel = payload.priceLabel?.trim() ?? ''
    const quantityLabel = payload.quantityLabel?.trim() ?? ''
    const sortOrder = Number.isFinite(payload.sortOrder) ? Number(payload.sortOrder) : 0

    if (!productName || !priceLabel || !quantityLabel) {
      return jsonResponse({ error: 'Preencha produto, preço e quantidade.' }, 400)
    }

    const admin = createAdminClient()
    const row = {
      is_active: payload.isActive ?? true,
      price_label: priceLabel,
      product_name: productName,
      quantity_label: quantityLabel,
      sort_order: sortOrder,
    }

    if (payload.id) {
      const { error } = await admin.from('scrap_price_items').update(row).eq('id', payload.id)
      if (error) throw error
      return jsonResponse({ id: payload.id, success: true })
    }

    const { data, error } = await admin.from('scrap_price_items').insert(row).select('id').single()
    if (error || !data) throw error ?? new Error('Falha ao criar item.')

    return jsonResponse({ id: data.id, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

