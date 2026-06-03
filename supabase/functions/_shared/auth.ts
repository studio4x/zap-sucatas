import { createAdminClient } from './supabase.ts'

export type ActorProfile = {
  auth_user_id: string
  full_name: string | null
  id: string
  role: 'admin' | 'user'
  status: 'active' | 'suspended' | 'under_review'
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

async function getBodyAccessToken(request: Request) {
  try {
    const payload = (await request.clone().json()) as { access_token?: unknown }

    if (typeof payload.access_token === 'string' && payload.access_token.trim().length > 0) {
      return payload.access_token.trim()
    }
  } catch {
    return null
  }

  return null
}

export async function getBearerToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length)
  }

  const bodyToken = await getBodyAccessToken(request)

  if (bodyToken) {
    return bodyToken
  }

  throw new HttpError('Token de autenticação ausente.', 401)
}

export async function getAuthUserId(request: Request) {
  const token = await getBearerToken(request)
  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)

  if (error || !data.user?.id) {
    throw new HttpError('Sessão inválida ou expirada.', 401)
  }

  return data.user.id
}

export async function requireActiveProfile(request: Request) {
  const admin = createAdminClient()
  const authUserId = await getAuthUserId(request)
  const { data, error } = await admin
    .from('profiles')
    .select('id, auth_user_id, full_name, role, status')
    .eq('auth_user_id', authUserId)
    .single()

  if (error || !data) {
    throw new HttpError('Nenhum perfil ativo foi encontrado.', 403)
  }

  if (data.status !== 'active') {
    throw new HttpError('O perfil não está ativo.', 403)
  }

  return data as ActorProfile
}

export async function requireAdminProfile(request: Request) {
  const profile = await requireActiveProfile(request)

  if (profile.role !== 'admin') {
    throw new HttpError('Acesso de administrador obrigatório.', 403)
  }

  return profile
}

export function resolveHttpErrorStatus(error: unknown) {
  return error instanceof HttpError ? error.status : 500
}


