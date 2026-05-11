/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { asaasRequest, resolveFeaturedBillingType, resolveFeaturedDueDays, resolveFeaturedPriceValue } from '../_shared/asaas.ts'
import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

function hasEnv(name: string) {
  const value = Deno.env.get(name)
  return Boolean(value && value.trim().length > 0)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)

    const config = {
      apiKeyConfigured: hasEnv('ASAAS_API_KEY'),
      apiUrl: Deno.env.get('ASAAS_API_URL')?.trim() || 'https://api-sandbox.asaas.com/v3',
      billingType: resolveFeaturedBillingType(),
      dueDays: resolveFeaturedDueDays(),
      featuredPrice: resolveFeaturedPriceValue(),
      webhookTokenConfigured: hasEnv('ASAAS_WEBHOOK_TOKEN'),
    }

    if (!config.apiKeyConfigured) {
      return jsonResponse({
        config,
        connectivity: {
          errorMessage: 'ASAAS_API_KEY não configurada no ambiente.',
          ok: false,
          testedAt: new Date().toISOString(),
        },
        success: true,
      })
    }

    await asaasRequest('/payments?limit=1&offset=0')

    return jsonResponse({
      config,
      connectivity: {
        ok: true,
        testedAt: new Date().toISOString(),
      },
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse(
      {
        config: {
          apiKeyConfigured: hasEnv('ASAAS_API_KEY'),
          apiUrl: Deno.env.get('ASAAS_API_URL')?.trim() || 'https://api-sandbox.asaas.com/v3',
          billingType: resolveFeaturedBillingType(),
          dueDays: resolveFeaturedDueDays(),
          featuredPrice: resolveFeaturedPriceValue(),
          webhookTokenConfigured: hasEnv('ASAAS_WEBHOOK_TOKEN'),
        },
        connectivity: {
          errorMessage: message,
          ok: false,
          testedAt: new Date().toISOString(),
        },
        success: false,
      },
      resolveHttpErrorStatus(error),
    )
  }
})
