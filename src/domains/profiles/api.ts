import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
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

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessao invalida. Faca login novamente.')
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
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  return accessToken
}

async function unwrapFunctionError(error: unknown) {
  if (typeof error !== 'object' || error === null || !('context' in error)) {
    throw error
  }

  const context = (error as { context?: Response }).context

  if (!context) {
    throw error
  }

  try {
    const payload = (await context.json()) as { error?: string }

    if (payload.error) {
      throw new Error(payload.error)
    }
  } catch (parseError) {
    if (parseError instanceof Error && parseError.message) {
      throw parseError
    }

    throw error
  }

  throw error
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
    await unwrapFunctionError(error)
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

export async function fetchAdminProfileStats() {
  const client = ensureSupabase()
  const [
    { count: totalCount, error: totalError },
    { count: adminCount, error: adminError },
    { count: suspendedCount, error: suspendedError },
    { count: underReviewCount, error: underReviewError },
  ] = await Promise.all([
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    client.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
    client.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
  ])

  if (totalError || adminError || suspendedError || underReviewError) {
    throw totalError ?? adminError ?? suspendedError ?? underReviewError ?? new Error('Falha ao carregar os indicadores.')
  }

  return {
    admins: adminCount ?? 0,
    suspended: suspendedCount ?? 0,
    total: totalCount ?? 0,
    underReview: underReviewCount ?? 0,
  }
}

export async function fetchAdminProfilesPage(input: {
  page: number
  pageSize: number
  query?: string
  role?: 'admin' | 'all' | 'user'
  status?: 'active' | 'all' | 'suspended' | 'under_review'
}): Promise<PaginatedResult<AdminProfileSummary>> {
  const client = ensureSupabase()
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = client
    .from('profiles')
    .select('id, auth_user_id, email, full_name, phone, role, is_admin, status, created_at, updated_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (input.role && input.role !== 'all') {
    query = query.eq('role', input.role)
  }

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    query = query.or(`full_name.ilike.${search},email.ilike.${search},phone.ilike.${search}`)
  }

  const { data: profiles, error: profilesError, count } = await query

  if (profilesError) {
    throw profilesError
  }

  const profileRows = (profiles ?? []) as ProfileRow[]
  const profileIds = profileRows.map((row) => row.id)

  if (profileIds.length === 0) {
    return {
      items: [],
      totalCount: count ?? 0,
    }
  }

  const [{ data: listings, error: listingsError }, { data: questions, error: questionsError }] =
    await Promise.all([
      client.from('listings').select('user_id, status').in('user_id', profileIds),
      client.from('listing_questions').select('author_user_id').in('author_user_id', profileIds),
    ])

  if (listingsError || questionsError) {
    throw listingsError ?? questionsError ?? new Error('Falha ao carregar a atividade dos usuários.')
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

  return {
    items: profileRows.map((row) => {
      const profile = mapProfile(row)
      const counts = listingCounts.get(profile.id) ?? { approved: 0, total: 0 }

      return {
        ...profile,
        approvedListings: counts.approved,
        authoredQuestions: questionCounts.get(profile.id) ?? 0,
        totalListings: counts.total,
      } satisfies AdminProfileSummary
    }),
    totalCount: count ?? 0,
  }
}

async function invokeUserManagementFunction(body: Record<string, unknown>) {
  ensureSupabase()

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  const accessToken = await getFreshAccessToken()
  const response = await fetch(`${env.supabaseUrl}/functions/v1/manage-user-account`, {
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

  if (!response.ok) {
    try {
      const payload = (await response.json()) as { error?: string }

      if (payload.error) {
        throw new Error(payload.error)
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) {
        throw parseError
      }
    }

    throw new Error('Edge Function returned a non-2xx status code')
  }

  return (await response.json()) as { profileId: string; success: boolean }
}

export async function createAdminUser(input: {
  email: string
  fullName: string
  password: string
  phone: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}) {
  return invokeUserManagementFunction({
    email: input.email,
    fullName: input.fullName,
    mode: 'create',
    password: input.password,
    phone: input.phone,
    role: input.role,
    status: input.status,
  })
}

export async function updateAdminUser(input: {
  email: string
  fullName: string
  phone: string
  profileId: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}) {
  return invokeUserManagementFunction({
    email: input.email,
    fullName: input.fullName,
    mode: 'update',
    phone: input.phone,
    profileId: input.profileId,
    role: input.role,
    status: input.status,
  })
}

export async function deleteAdminUser(profileId: string) {
  return invokeUserManagementFunction({
    mode: 'delete',
    profileId,
  })
}

export async function resetAdminUserPassword(input: {
  password: string
  profileId: string
}) {
  return invokeUserManagementFunction({
    mode: 'reset_password',
    password: input.password,
    profileId: input.profileId,
  })
}
