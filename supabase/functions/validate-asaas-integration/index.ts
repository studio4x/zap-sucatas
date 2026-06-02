/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { asaasRequest, resolveFeaturedBillingType, resolveFeaturedDueDays, resolveFeaturedPriceValue } from '../_shared/asaas.ts'
import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

function hasEnv(name: string) {
  const value = Deno.env.get(name)
  return Boolean(value && value.trim().length > 0)
}

function resolveWebhookUrl() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  if (!supabaseUrl) {
    return 'Não disponível'
  }

  return `${supabaseUrl}/functions/v1/asaas-payment-webhook`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const admin = createAdminClient()
    const { data: settings, error: settingsError } = await admin
      .from('system_settings')
      .select('asaas_environment')
      .limit(1)
      .single()

    if (settingsError || !settings) {
      throw settingsError ?? new Error('System settings not found.')
    }

    const asaasEnvironment = settings.asaas_environment === 'production' ? 'production' : 'sandbox'
    const defaultApiUrl =
      asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://api-sandbox.asaas.com/v3'

    const config = {
      asaasEnvironment,
      apiKeyConfigured: hasEnv('ASAAS_API_KEY'),
      apiUrl: Deno.env.get('ASAAS_API_URL')?.trim() || defaultApiUrl,
      billingType: resolveFeaturedBillingType(),
      dueDays: resolveFeaturedDueDays(),
      featuredPrice: resolveFeaturedPriceValue(),
      webhookUrl: resolveWebhookUrl(),
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
          asaasEnvironment: 'sandbox',
          apiKeyConfigured: hasEnv('ASAAS_API_KEY'),
          apiUrl: Deno.env.get('ASAAS_API_URL')?.trim() || 'https://api-sandbox.asaas.com/v3',
          billingType: resolveFeaturedBillingType(),
          dueDays: resolveFeaturedDueDays(),
          featuredPrice: resolveFeaturedPriceValue(),
          webhookUrl: resolveWebhookUrl(),
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