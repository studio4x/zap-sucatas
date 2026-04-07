import { createAdminClient } from './supabase.ts'

export type ActorProfile = {
  auth_user_id: string
  full_name: string | null
  id: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}

function decodeJwtPayload(token: string) {
  const parts = token.split('.')

  if (parts.length < 2) {
    throw new Error('Invalid JWT')
  }

  const payload = parts[1]
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const decoded = atob(padded)

  return JSON.parse(decoded)
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.')
  }

  return authorization.slice('Bearer '.length)
}

export function getAuthUserId(request: Request) {
  const token = getBearerToken(request)
  const payload = decodeJwtPayload(token)

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('Invalid auth user id.')
  }

  return payload.sub
}

export async function requireActiveProfile(request: Request) {
  const admin = createAdminClient()
  const authUserId = getAuthUserId(request)
  const { data, error } = await admin
    .from('profiles')
    .select('id, auth_user_id, full_name, role, status')
    .eq('auth_user_id', authUserId)
    .single()

  if (error || !data) {
    throw new Error('Active profile not found.')
  }

  if (data.status !== 'active') {
    throw new Error('Profile is not active.')
  }

  return data as ActorProfile
}

export async function requireAdminProfile(request: Request) {
  const profile = await requireActiveProfile(request)

  if (profile.role !== 'admin') {
    throw new Error('Admin access required.')
  }

  return profile
}
