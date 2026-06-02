import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { AdminListingLocation, AdminLocationListingItem } from '@/domains/locations/types'

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

async function invokeLocationFunction<TBody extends object, TResponse>(name: string, body: TBody) {
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

export async function fetchAdminLocations() {
  const response = await invokeLocationFunction<
    Record<string, never>,
    { items: AdminListingLocation[]; success: boolean }
  >('list-admin-locations', {})

  return response.items
}

export async function upsertAdminLocation(input: { city: string; state: string }) {
  return invokeLocationFunction<{ city: string; state: string }, { success: boolean }>('upsert-admin-location', input)
}

export async function deleteAdminLocation(input: { city: string; state: string }) {
  return invokeLocationFunction<{ city: string; state: string }, { success: boolean }>('delete-admin-location', input)
}

export async function fetchLocationListings(input: { city: string; state: string }) {
  const response = await invokeLocationFunction<
    { city: string; state: string },
    { items: Array<{ city: string; id: string; state: string; status: string; title: string; updated_at: string }>; success: boolean }
  >('list-location-listings', input)

  return response.items.map((item) => ({
    city: item.city,
    id: item.id,
    state: item.state,
    status: item.status,
    title: item.title,
    updatedAt: item.updated_at,
  })) as AdminLocationListingItem[]
}