/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { requireEnv } from '../_shared/env.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type NormalizedLmeEntry = {
  currency_code: string
  metal_code: string
  metal_name: string
  price_value: number
  quoted_at: string
  source_payload: unknown
}

function normalizeEntries(payload: unknown): NormalizedLmeEntry[] {
  const sourceArray = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : Array.isArray((payload as { prices?: unknown[] })?.prices)
        ? (payload as { prices: unknown[] }).prices
        : []

  return sourceArray
    .map((entry) => {
      const item = entry as Record<string, unknown>
      const metalCode = String(item.metal_code ?? item.code ?? '')
      const metalName = String(item.metal_name ?? item.name ?? metalCode)
      const currencyCode = String(item.currency_code ?? item.currency ?? 'USD')
      const priceValue = Number(item.price_value ?? item.price ?? item.value)
      const quotedAt = String(item.quoted_at ?? item.date ?? item.timestamp ?? '')

      if (!metalCode || !metalName || Number.isNaN(priceValue) || !quotedAt) {
        return null
      }

      return {
        metal_code: metalCode,
        metal_name: metalName,
        currency_code: currencyCode,
        price_value: priceValue,
        quoted_at: new Date(quotedAt).toISOString(),
        source_payload: item,
      }
    })
    .filter((entry): entry is NormalizedLmeEntry => entry !== null)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)

    const endpoint = requireEnv('LME_API_URL')
    const apiKey = Deno.env.get('LME_API_KEY')
    const authHeader = Deno.env.get('LME_API_AUTH_HEADER') ?? 'Authorization'
    const headers = new Headers({
      'Content-Type': 'application/json',
    })

    if (apiKey) {
      headers.set(
        authHeader,
        authHeader.toLowerCase() === 'authorization' ? `Bearer ${apiKey}` : apiKey,
      )
    }

    const response = await fetch(endpoint, { headers })

    if (!response.ok) {
      throw new Error(`LME provider returned status ${response.status}`)
    }

    const payload = await response.json()
    const entries = normalizeEntries(payload)

    if (entries.length === 0) {
      throw new Error('No valid LME entries were found in the provider payload.')
    }

    const admin = createAdminClient()
    const { error: insertError } = await admin.from('lme_price_snapshots').insert(entries)

    if (insertError) {
      throw insertError
    }

    await insertIntegrationLog({
      integrationName: 'lme',
      status: 'success',
      message: `Inserted ${entries.length} LME price snapshots.`,
      payload: { count: entries.length },
    })

    return jsonResponse({
      inserted: entries.length,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'

    await insertIntegrationLog({
      integrationName: 'lme',
      status: 'error',
      message,
    })

    return jsonResponse({ error: message }, 500)
  }
})
