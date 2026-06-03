/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type ListingRow = {
  city: string
  state: string
  status: 'approved' | 'archived' | 'draft' | 'expired' | 'paused' | 'pending_review' | 'rejected'
  updated_at: string
}

type ManagedLocationRow = {
  city: string
  is_active: boolean
  state: string
}

function normalizeState(value: string) {
  return value.trim().toUpperCase().slice(0, 2)
}

function normalizeCity(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireAdminProfile(request)
    const admin = createAdminClient()

    const [{ data: listings, error: listingsError }, { data: managed, error: managedError }] = await Promise.all([
      admin.from('listings').select('city, state, status, updated_at'),
      admin.from('admin_listing_localities').select('state, city, is_active'),
    ])

    if (listingsError) {
      throw listingsError
    }

    if (managedError) {
      throw managedError
    }

    const managedMap = new Map<string, ManagedLocationRow>()
    for (const row of (managed ?? []) as ManagedLocationRow[]) {
      const key = `${normalizeState(row.state)}-${normalizeCity(row.city).toLowerCase()}`
      managedMap.set(key, row)
    }

    const grouped = new Map<
      string,
      { approvedListings: number; city: string; lastUpdatedAt: string | null; pendingListings: number; state: string; totalListings: number }
    >()

    for (const row of (listings ?? []) as ListingRow[]) {
      const state = normalizeState(row.state)
      const city = normalizeCity(row.city)
      const key = `${state}-${city.toLowerCase()}`
      const managedItem = managedMap.get(key)

      if (managedItem && !managedItem.is_active) {
        continue
      }

      const current = grouped.get(key) ?? {
        approvedListings: 0,
        city,
        lastUpdatedAt: row.updated_at,
        pendingListings: 0,
        state,
        totalListings: 0,
      }

      current.totalListings += 1
      current.lastUpdatedAt =
        !current.lastUpdatedAt || current.lastUpdatedAt < row.updated_at ? row.updated_at : current.lastUpdatedAt

      if (row.status === 'approved') {
        current.approvedListings += 1
      }

      if (row.status === 'pending_review') {
        current.pendingListings += 1
      }

      grouped.set(key, current)
    }

    for (const row of (managed ?? []) as ManagedLocationRow[]) {
      if (!row.is_active) {
        continue
      }

      const state = normalizeState(row.state)
      const city = normalizeCity(row.city)
      const key = `${state}-${city.toLowerCase()}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          approvedListings: 0,
          city,
          lastUpdatedAt: null,
          pendingListings: 0,
          state,
          totalListings: 0,
        })
      }
    }

    const items = [...grouped.values()].sort((left, right) => {
      if (left.state === right.state) {
        return left.city.localeCompare(right.city, 'pt-BR')
      }
      return left.state.localeCompare(right.state, 'pt-BR')
    })

    return jsonResponse({ items, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, resolveHttpErrorStatus(error))
  }
})

