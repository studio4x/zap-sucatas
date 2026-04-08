import { supabase } from '@/integrations/supabase/client'
import type { AdminListingLocation } from '@/domains/locations/types'

type ListingLocationRow = {
  city: string
  state: string
  status: 'approved' | 'archived' | 'draft' | 'expired' | 'paused' | 'pending_review' | 'rejected'
  updated_at: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

export async function fetchAdminLocations() {
  const { data, error } = await ensureSupabase()
    .from('listings')
    .select('city, state, status, updated_at')
    .order('state', { ascending: true })
    .order('city', { ascending: true })

  if (error) {
    throw error
  }

  const grouped = new Map<string, AdminListingLocation>()

  ;((data ?? []) as ListingLocationRow[]).forEach((row) => {
    const key = `${row.state}-${row.city}`.toLowerCase()
    const current = grouped.get(key) ?? {
      approvedListings: 0,
      city: row.city,
      lastUpdatedAt: row.updated_at,
      pendingListings: 0,
      state: row.state,
      totalListings: 0,
    }

    current.totalListings += 1
    current.lastUpdatedAt =
      !current.lastUpdatedAt || current.lastUpdatedAt < row.updated_at
        ? row.updated_at
        : current.lastUpdatedAt

    if (row.status === 'approved') {
      current.approvedListings += 1
    }

    if (row.status === 'pending_review') {
      current.pendingListings += 1
    }

    grouped.set(key, current)
  })

  return [...grouped.values()].sort((left, right) => {
    if (left.state === right.state) {
      return left.city.localeCompare(right.city, 'pt-BR')
    }
    return left.state.localeCompare(right.state, 'pt-BR')
  })
}
