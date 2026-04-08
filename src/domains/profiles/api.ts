import { supabase } from '@/integrations/supabase/client'
import type { Profile } from '@/domains/profiles/types'

type ProfileRow = {
  auth_user_id: string
  created_at: string
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
    .select('id, auth_user_id, full_name, phone, role, is_admin, status, created_at, updated_at')
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
