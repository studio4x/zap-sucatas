import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { ScrapPriceItem } from '@/domains/scrap-prices/types'

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

  if (error) throw error

  const accessToken = data.session?.access_token ?? session.access_token
  if (!accessToken) throw new Error('Sessão inválida. Faça login novamente.')
  return accessToken
}

async function invokeFn<TBody extends object, TResponse>(name: string, body: TBody, withAuth = true) {
  ensureSupabase()
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  const accessToken = withAuth ? await getFreshAccessToken() : null

  const response = await fetch(`${env.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({
      ...body,
      ...(accessToken ? { access_token: accessToken } : {}),
    }),
  })

  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    if (payload?.error) throw new Error(payload.error)
    throw new Error('Edge Function returned a non-2xx status code')
  }

  return payload as TResponse
}

export async function fetchPublicScrapPrices() {
  const response = await invokeFn<Record<string, never>, { items: ScrapPriceItem[]; success: boolean }>(
    'list-scrap-prices-public',
    {},
    false,
  )
  return response.items
}

export async function fetchAdminScrapPrices() {
  const response = await invokeFn<Record<string, never>, { items: ScrapPriceItem[]; success: boolean }>(
    'list-scrap-prices-admin',
    {},
  )
  return response.items
}

export async function upsertScrapPrice(input: {
  id?: string
  isActive: boolean
  priceLabel: string
  productName: string
  quantityLabel: string
  sortOrder: number
}) {
  return invokeFn<typeof input, { id: string; success: boolean }>('upsert-scrap-price', input)
}

export async function deleteScrapPrice(id: string) {
  return invokeFn<{ id: string }, { success: boolean }>('delete-scrap-price', { id })
}

export async function upsertScrapPrices(input: {
  items: Array<{
    id?: string
    isActive: boolean
    priceLabel: string
    productName: string
    quantityLabel: string
    sortOrder: number
  }>
}) {
  return invokeFn<typeof input, { count: number; success: boolean }>('upsert-scrap-price-items', input)
}
