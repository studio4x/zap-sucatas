import type { Session } from '@supabase/supabase-js'
import type { AuthRole, ProfileStatus, SessionUser } from '@/domains/auth/types'
import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'

type AuthPayload = {
  email: string
  password: string
}

type SignUpPayload = AuthPayload & {
  fullName: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function getBaseUrl() {
  if (env.appUrl) {
    return env.appUrl
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:5173'
}

type ProfileRow = {
  auth_user_id: string
  full_name: string | null
  id: string
  role: AuthRole
  status: ProfileStatus
}

async function fetchProfileByAuthUserId(authUserId: string) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, auth_user_id, full_name, role, status')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    return null
  }

  return data as ProfileRow | null
}

export async function resolveSessionUser(session: Session | null): Promise<SessionUser | null> {
  if (!session?.user) {
    return null
  }

  const profile = await fetchProfileByAuthUserId(session.user.id)

  return {
    id: session.user.id,
    profileId: profile?.id ?? null,
    email: session.user.email ?? '',
    fullName:
      profile?.full_name ??
      (typeof session.user.user_metadata?.full_name === 'string'
        ? session.user.user_metadata.full_name
        : null),
    role: profile?.role ?? 'user',
    status: profile?.status ?? 'under_review',
  }
}

export async function signInWithPassword(payload: AuthPayload) {
  const client = ensureSupabase()
  const { data, error } = await client.auth.signInWithPassword(payload)

  if (error) {
    throw error
  }

  return resolveSessionUser(data.session)
}

export async function sendMagicLink(email: string, redirectPath = '/app') {
  const client = ensureSupabase()
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getBaseUrl()}${redirectPath}`,
    },
  })

  if (error) {
    throw error
  }
}

export async function sendWelcomeLink(email: string) {
  return sendMagicLink(email, '/app')
}

export async function signUp(payload: SignUpPayload, redirectPath = '/app') {
  const client = ensureSupabase()
  const { data, error } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}${redirectPath}`,
      data: {
        full_name: payload.fullName,
      },
    },
  })

  if (error) {
    throw error
  }

  return resolveSessionUser(data.session)
}

export async function requestPasswordReset(email: string) {
  const client = ensureSupabase()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/recuperar-senha`,
  })

  if (error) {
    throw error
  }
}

export async function updatePassword(password: string) {
  const client = ensureSupabase()
  const { error } = await client.auth.updateUser({ password })

  if (error) {
    throw error
  }
}

export async function loadCurrentSessionUser() {
  const client = ensureSupabase()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return resolveSessionUser(data.session)
}

export async function signOutFromSupabase() {
  const client = ensureSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}
