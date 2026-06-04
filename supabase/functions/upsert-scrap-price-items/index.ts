/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type PayloadItem = {
  id?: string
  isActive?: boolean
  priceLabel?: string
  productName?: string
  quantityLabel?: string
  sortOrder?: number
}

type Payload = {
  items?: PayloadItem[]
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const payload = (await request.json()) as Payload
    const items = Array.isArray(payload.items) ? payload.items : []

    if (items.length === 0) {
      return jsonResponse({ error: 'Envie ao menos um item para importação.' }, 400)
    }

    const rows = items.map((item, index) => {
      const productName = item.productName?.trim() ?? ''
      const priceLabel = item.priceLabel?.trim() ?? ''
      const quantityLabel = item.quantityLabel?.trim() ?? ''
      const sortOrder = Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : 0

      if (!productName || !priceLabel || !quantityLabel) {
        throw new Error(`Linha ${index + 2}: preencha produto, preço e quantidade.`)
      }

      return {
        id: item.id?.trim() || undefined,
        is_active: item.isActive ?? true,
        price_label: priceLabel,
        product_name: productName,
        quantity_label: quantityLabel,
        sort_order: sortOrder,
      }
    })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('scrap_price_items')
      .upsert(rows, { onConflict: 'id' })
      .select('id')

    if (error) throw error

    return jsonResponse({ count: data?.length ?? rows.length, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})
