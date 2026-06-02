import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { AdminFeaturedPaymentItem, AsaasIntegrationValidation } from '@/domains/featured-payments/types'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessão inválida. Faça login novamente.')
    }

    return session.access_token
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token ?? session.access_token

  if (!accessToken) {
    throw new Error('Sessão inválida. Faça login novamente.')
  }

  return accessToken
}

async function invokeFeaturedPaymentFunction<TBody extends object, TResponse>(name: string, body: TBody) {
  ensureSupabase()

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  const accessToken = await getFreshAccessToken()
  const response = await fetch(`${env.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({
      ...body,
      access_token: accessToken,
    }),
  })

  const payload = (await response.json().catch(() => null)) as { error?: string } | null

  if (!response.ok) {
    if (payload?.error) {
      throw new Error(payload.error)
    }

    throw new Error('Edge Function returned a non-2xx status code')
  }

  return payload as TResponse
}

export async function fetchAdminFeaturedPayments() {
  const response = await invokeFeaturedPaymentFunction<
    Record<string, never>,
    { items: AdminFeaturedPaymentItem[]; success: boolean }
  >('list-admin-featured-payments', {})

  return response.items
}

export async function validateAsaasIntegration() {
  return invokeFeaturedPaymentFunction<Record<string, never>, AsaasIntegrationValidation>(
    'validate-asaas-integration',
    {},
  )
}

export async function updateAsaasEnvironment(mode: 'production' | 'sandbox') {
  return invokeFeaturedPaymentFunction<
    { mode: 'production' | 'sandbox' },
    { mode: 'production' | 'sandbox'; success: boolean }
  >('update-asaas-environment', { mode })
}