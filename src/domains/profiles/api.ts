import { supabase } from '@/integrations/supabase/client'
import type { AdminProfileSummary, Profile } from '@/domains/profiles/types'

type ProfileRow = {
  auth_user_id: string
  created_at: string
  email: string | null
  full_name: string
  id: string
  is_admin: boolean
  phone: string | null
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
  updated_at: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

function mapProfile(row: ProfileRow): Profile {
  return {
    authUserId: row.auth_user_id,
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    isAdmin: row.is_admin,
    phone: row.phone,
    role: row.role,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

export async function fetchCurrentProfile(profileId: string) {
  const { data, error } = await ensureSupabase()
    .from('profiles')
    .select('id, auth_user_id, email, full_name, phone, role, is_admin, status, created_at, updated_at')
    .eq('id', profileId)
    .single()

  if (error || !data) {
    throw error ?? new Error('Perfil nao encontrado.')
  }

  return mapProfile(data as ProfileRow)
}

export async function updateCurrentProfile(input: {
  fullName: string
  phone: string
  profileId: string
}) {
  const client = ensureSupabase()
  const payload = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim() || null,
  }

  const { error } = await client.from('profiles').update(payload).eq('id', input.profileId)

  if (error) {
    throw error
  }

  const { error: authError } = await client.auth.updateUser({
    data: {
      full_name: payload.full_name,
    },
  })

  if (authError) {
    throw authError
  }

  return fetchCurrentProfile(input.profileId)
}

export async function fetchAdminProfiles() {
  const client = ensureSupabase()
  const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }, { data: questions, error: questionsError }] =
    await Promise.all([
      client
        .from('profiles')
        .select('id, auth_user_id, email, full_name, phone, role, is_admin, status, created_at, updated_at')
        .order('created_at', { ascending: false }),
      client.from('listings').select('user_id, status'),
      client.from('listing_questions').select('author_user_id'),
    ])

  if (profilesError) {
    throw profilesError
  }

  if (listingsError) {
    throw listingsError
  }

  if (questionsError) {
    throw questionsError
  }

  const listingCounts = new Map<string, { approved: number; total: number }>()
  ;((listings ?? []) as Array<{ status: string; user_id: string }>).forEach((row) => {
    const current = listingCounts.get(row.user_id) ?? { approved: 0, total: 0 }
    current.total += 1
    if (row.status === 'approved') {
      current.approved += 1
    }
    listingCounts.set(row.user_id, current)
  })

  const questionCounts = new Map<string, number>()
  ;((questions ?? []) as Array<{ author_user_id: string | null }>).forEach((row) => {
    if (!row.author_user_id) {
      return
    }
    questionCounts.set(row.author_user_id, (questionCounts.get(row.author_user_id) ?? 0) + 1)
  })

  return (profiles ?? []).map((row) => {
    const profile = mapProfile(row as ProfileRow)
    const counts = listingCounts.get(profile.id) ?? { approved: 0, total: 0 }

    return {
      ...profile,
      approvedListings: counts.approved,
      authoredQuestions: questionCounts.get(profile.id) ?? 0,
      totalListings: counts.total,
    } satisfies AdminProfileSummary
  })
}

export async function createAdminUser(input: {
  email: string
  fullName: string
  password: string
  phone: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-user-account', {
    body: {
      email: input.email,
      fullName: input.fullName,
      mode: 'create',
      password: input.password,
      phone: input.phone,
      role: input.role,
      status: input.status,
    },
  })

  if (error) {
    throw error
  }

  return data as { profileId: string; success: boolean }
}

export async function updateAdminUser(input: {
  email: string
  fullName: string
  phone: string
  profileId: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}) {
  const { data, error } = await ensureSupabase().functions.invoke('manage-user-account', {
    body: {
      email: input.email,
      fullName: input.fullName,
      mode: 'update',
      phone: input.phone,
      profileId: input.profileId,
      role: input.role,
      status: input.status,
    },
  })

  if (error) {
    throw error
  }

  return data as { profileId: string; success: boolean }
}
