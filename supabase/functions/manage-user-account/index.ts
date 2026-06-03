/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { getBearerToken } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type UserRole = 'admin' | 'user'
type UserStatus = 'active' | 'suspended' | 'under_review'

type BasePayload = {
  email?: string
  fullName?: string
  phone?: string | null
  role?: UserRole
  status?: UserStatus
}

type CreatePayload = BasePayload & {
  mode: 'create'
  password?: string
}

type UpdatePayload = BasePayload & {
  mode: 'update'
  profileId?: string
}

type DeletePayload = {
  mode: 'delete'
  profileId?: string
}

type ResetPasswordPayload = {
  mode: 'reset_password'
  password?: string
  profileId?: string
}

type RequestBody = CreatePayload | DeletePayload | ResetPasswordPayload | UpdatePayload

const VALIDATION_ERRORS = [
  'Modo inválido para criação.',
  'Modo inválido para atualização.',
  'Modo inválido para exclusão.',
  'Modo inválido para redefinição de senha.',
  'Papel inválido.',
  'Status inválido.',
  'E-mail válido é obrigatório.',
  'Nome completo é obrigatório.',
  'A senha deve ter pelo menos 8 caracteres.',
  'profileId é obrigatório.',
]

function translateUserManagementError(message: string) {
  const normalized = message.trim().toLowerCase()

  if (normalized === 'invalid mode for create.') {
    return 'Modo inválido para criação.'
  }

  if (normalized === 'invalid mode for update.') {
    return 'Modo inválido para atualização.'
  }

  if (normalized === 'invalid mode for delete.') {
    return 'Modo inválido para exclusão.'
  }

  if (normalized === 'invalid mode for reset password.') {
    return 'Modo inválido para redefinição de senha.'
  }

  if (normalized === 'invalid role.') {
    return 'Papel inválido.'
  }

  if (normalized === 'invalid status.') {
    return 'Status inválido.'
  }

  if (normalized === 'valid email is required.') {
    return 'E-mail válido é obrigatório.'
  }

  if (normalized === 'full name is required.') {
    return 'Nome completo é obrigatório.'
  }

  if (normalized === 'password must be at least 8 characters long.') {
    return 'A senha deve ter pelo menos 8 caracteres.'
  }

  if (normalized === 'profileid is required.') {
    return 'profileId é obrigatório.'
  }

  if (
    normalized.includes('already been registered') ||
    normalized.includes('already registered') ||
    normalized.includes('email already exists') ||
    normalized.includes('duplicate key value violates unique constraint') ||
    normalized.includes('users_email_key')
  ) {
    return 'Um usuário com este endereço de e-mail já foi cadastrado.'
  }

  if (normalized === 'missing bearer token.') {
    return 'Token de autenticação ausente.'
  }

  if (normalized === 'invalid or expired session.') {
    return 'Sessão inválida ou expirada.'
  }

  if (normalized === 'active profile not found.') {
    return 'Nenhum perfil ativo foi encontrado.'
  }

  if (normalized === 'admin access required.') {
    return 'Acesso de administrador obrigatório.'
  }

  if (normalized === 'unauthorized.') {
    return 'Não autorizado.'
  }

  if (normalized === 'unable to create auth user.') {
    return 'Não foi possível criar o usuário de autenticação.'
  }

  if (normalized === 'unable to persist profile.') {
    return 'Não foi possível salvar o perfil.'
  }

  if (normalized === 'profile not found.') {
    return 'Perfil não encontrado.'
  }

  if (normalized === 'you cannot delete your own admin account.') {
    return 'Você não pode excluir sua própria conta de administrador.'
  }

  if (normalized === 'you cannot remove your own admin access or suspend your own profile.') {
    return 'Você não pode remover seu próprio acesso de administrador nem suspender seu próprio perfil.'
  }

  if (normalized === 'unable to update profile.') {
    return 'Não foi possível atualizar o perfil.'
  }

  if (normalized === 'unexpected error.') {
    return 'Erro inesperado.'
  }

  return message
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizePhone(value?: string | null) {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function ensureRole(value: unknown): UserRole {
  if (value === 'admin' || value === 'user') {
    return value
  }

  throw new Error('Papel inválido.')
}

function ensureStatus(value: unknown): UserStatus {
  if (value === 'active' || value === 'suspended' || value === 'under_review') {
    return value
  }

  throw new Error('Status inválido.')
}

function validateCreatePayload(payload: RequestBody) {
  if (payload.mode !== 'create') {
    throw new Error('Modo inválido para criação.')
  }

  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  const fullName = typeof payload.fullName === 'string' ? normalizeFullName(payload.fullName) : ''
  const password = typeof payload.password === 'string' ? payload.password.trim() : ''
  const role = ensureRole(payload.role)
  const status = ensureStatus(payload.status)

  if (!email.includes('@')) {
    throw new Error('E-mail válido é obrigatório.')
  }

  if (fullName.length < 3) {
    throw new Error('Nome completo é obrigatório.')
  }

  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.')
  }

  return {
    email,
    fullName,
    password,
    phone: normalizePhone(payload.phone),
    role,
    status,
  }
}

function validateUpdatePayload(payload: RequestBody) {
  if (payload.mode !== 'update') {
    throw new Error('Modo inválido para atualização.')
  }

  const profileId = typeof payload.profileId === 'string' ? payload.profileId.trim() : ''
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  const fullName = typeof payload.fullName === 'string' ? normalizeFullName(payload.fullName) : ''
  const role = ensureRole(payload.role)
  const status = ensureStatus(payload.status)

  if (profileId.length === 0) {
    throw new Error('profileId é obrigatório.')
  }

  if (!email.includes('@')) {
    throw new Error('E-mail válido é obrigatório.')
  }

  if (fullName.length < 3) {
    throw new Error('Nome completo é obrigatório.')
  }

  return {
    email,
    fullName,
    phone: normalizePhone(payload.phone),
    profileId,
    role,
    status,
  }
}

function validateDeletePayload(payload: RequestBody) {
  if (payload.mode !== 'delete') {
    throw new Error('Modo inválido para exclusão.')
  }

  const profileId = typeof payload.profileId === 'string' ? payload.profileId.trim() : ''

  if (profileId.length === 0) {
    throw new Error('profileId é obrigatório.')
  }

  return { profileId }
}

function validateResetPasswordPayload(payload: RequestBody) {
  if (payload.mode !== 'reset_password') {
    throw new Error('Modo inválido para redefinição de senha.')
  }

  const profileId = typeof payload.profileId === 'string' ? payload.profileId.trim() : ''
  const password = typeof payload.password === 'string' ? payload.password.trim() : ''

  if (profileId.length === 0) {
    throw new Error('profileId é obrigatório.')
  }

  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.')
  }

  return {
    password,
    profileId,
  }
}

async function requireVerifiedAdminProfile(request: Request) {
  let token = ''

  try {
    token = await getBearerToken(request)
  } catch {
    return {
      error: jsonResponse({ error: 'Token de autenticação ausente.' }, 401),
      profile: null,
    }
  }

  const admin = createAdminClient()
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return {
      error: jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401),
      profile: null,
    }
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, auth_user_id, role, status')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile || profile.status !== 'active') {
    return {
      error: jsonResponse({ error: 'Nenhum perfil ativo foi encontrado.' }, 403),
      profile: null,
    }
  }

  if (profile.role !== 'admin') {
    return {
      error: jsonResponse({ error: 'Acesso de administrador obrigatório.' }, 403),
      profile: null,
    }
  }

  return {
    error: null,
    profile,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireVerifiedAdminProfile(request)

    if (auth.error || !auth.profile) {
      return auth.error ?? jsonResponse({ error: 'Não autorizado.' }, 401)
    }

    const actor = auth.profile
    const payload = (await request.json()) as RequestBody
    const admin = createAdminClient()

    if (payload.mode === 'create') {
      const input = validateCreatePayload(payload)
      const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        password: input.password,
        user_metadata: {
          full_name: input.fullName,
        },
      })

      if (createUserError || !createdUser.user) {
        const message = createUserError?.message ?? 'Não foi possível criar o usuário de autenticação.'
        throw new Error(translateUserManagementError(message))
      }

      const authUserId = createdUser.user.id
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .upsert(
          {
            auth_user_id: authUserId,
            email: input.email,
            full_name: input.fullName,
            phone: input.phone,
            role: input.role,
            status: input.status,
          },
          {
            onConflict: 'auth_user_id',
          },
        )
        .select('id, auth_user_id, email, full_name, phone, role, status')
        .single()

      if (profileError || !profile) {
        throw profileError ?? new Error('Não foi possível salvar o perfil.')
      }

      await insertAdminAuditLog({
        action: 'create_user_account',
        actorUserId: actor.id,
        afterData: {
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          status: profile.status,
        },
        entityId: profile.id,
        entityType: 'profile',
      })

      return jsonResponse({
        profileId: profile.id,
        success: true,
      })
    }

    if (payload.mode === 'delete') {
      const input = validateDeletePayload(payload)
      const { data: existingProfile, error: existingProfileError } = await admin
        .from('profiles')
        .select('id, auth_user_id, email, full_name, phone, role, status')
        .eq('id', input.profileId)
        .single()

      if (existingProfileError || !existingProfile) {
        return jsonResponse({ error: 'Perfil não encontrado.' }, 404)
      }

      if (existingProfile.auth_user_id === actor.auth_user_id) {
        return jsonResponse({ error: 'Você não pode excluir sua própria conta de administrador.' }, 409)
      }

      const { data: ownedListings, error: ownedListingsError } = await admin
        .from('listings')
        .select('id')
        .eq('user_id', existingProfile.id)

      if (ownedListingsError) {
        throw ownedListingsError
      }

      const ownedListingIds = (ownedListings ?? []).map((row) => row.id as string)

      if (ownedListingIds.length > 0) {
        const { error: deleteOwnedListingsError } = await admin
          .from('listings')
          .delete()
          .in('id', ownedListingIds)

        if (deleteOwnedListingsError) {
          throw deleteOwnedListingsError
        }
      }

      const { error: deleteUserAnswersError } = await admin
        .from('listing_answers')
        .delete()
        .eq('responder_user_id', existingProfile.id)

      if (deleteUserAnswersError) {
        throw deleteUserAnswersError
      }

      const { error: deleteUserQuestionsError } = await admin
        .from('listing_questions')
        .delete()
        .eq('author_user_id', existingProfile.id)

      if (deleteUserQuestionsError) {
        throw deleteUserQuestionsError
      }

      const { error: deleteUserBlogPostsError } = await admin
        .from('blog_posts')
        .delete()
        .eq('author_user_id', existingProfile.id)

      if (deleteUserBlogPostsError) {
        throw deleteUserBlogPostsError
      }

      const { error: deleteUserContactMessagesError } = await admin
        .from('contact_messages')
        .delete()
        .eq('profile_id', existingProfile.id)

      if (deleteUserContactMessagesError) {
        throw deleteUserContactMessagesError
      }

      const { error: deleteUserAnalyticsEventsError } = await admin
        .from('analytics_events')
        .delete()
        .eq('profile_id', existingProfile.id)

      if (deleteUserAnalyticsEventsError) {
        throw deleteUserAnalyticsEventsError
      }

      const { error: deleteUserAuditLogsError } = await admin
        .from('admin_audit_logs')
        .delete()
        .eq('actor_user_id', existingProfile.id)

      if (deleteUserAuditLogsError) {
        throw deleteUserAuditLogsError
      }

      await insertAdminAuditLog({
        action: 'delete_user_account',
        actorUserId: actor.id,
        beforeData: {
          email: existingProfile.email,
          fullName: existingProfile.full_name,
          phone: existingProfile.phone,
          role: existingProfile.role,
          status: existingProfile.status,
        },
        entityId: existingProfile.id,
        entityType: 'profile',
      })

      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(existingProfile.auth_user_id)

      if (deleteAuthError) {
        throw deleteAuthError
      }

      return jsonResponse({
        profileId: existingProfile.id,
        success: true,
      })
    }

    if (payload.mode === 'reset_password') {
      const input = validateResetPasswordPayload(payload)
      const { data: existingProfile, error: existingProfileError } = await admin
        .from('profiles')
        .select('id, auth_user_id, email, full_name, phone, role, status')
        .eq('id', input.profileId)
        .single()

      if (existingProfileError || !existingProfile) {
        return jsonResponse({ error: 'Perfil não encontrado.' }, 404)
      }

      const { error: updatePasswordError } = await admin.auth.admin.updateUserById(
        existingProfile.auth_user_id,
        {
          password: input.password,
        },
      )

      if (updatePasswordError) {
        throw updatePasswordError
      }

      await insertAdminAuditLog({
        action: 'reset_user_password',
        actorUserId: actor.id,
        afterData: {
          email: existingProfile.email,
          fullName: existingProfile.full_name,
          status: existingProfile.status,
        },
        entityId: existingProfile.id,
        entityType: 'profile',
      })

      return jsonResponse({
        profileId: existingProfile.id,
        success: true,
      })
    }

    const input = validateUpdatePayload(payload)
    const { data: existingProfile, error: existingProfileError } = await admin
      .from('profiles')
      .select('id, auth_user_id, email, full_name, phone, role, status')
      .eq('id', input.profileId)
      .single()

      if (existingProfileError || !existingProfile) {
        return jsonResponse({ error: 'Perfil não encontrado.' }, 404)
      }

    if (
      existingProfile.auth_user_id === actor.auth_user_id &&
      (input.role !== 'admin' || input.status !== 'active')
    ) {
      return jsonResponse(
        { error: 'Você não pode remover seu próprio acesso de administrador nem suspender seu próprio perfil.' },
        409,
      )
    }

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(
      existingProfile.auth_user_id,
      {
        email: input.email,
        user_metadata: {
          full_name: input.fullName,
        },
      },
    )

    if (authUpdateError) {
      throw authUpdateError
    }

    const { data: updatedProfile, error: updatedProfileError } = await admin
      .from('profiles')
      .update({
        email: input.email,
        full_name: input.fullName,
        phone: input.phone,
        role: input.role,
        status: input.status,
      })
      .eq('id', input.profileId)
      .select('id, auth_user_id, email, full_name, phone, role, status')
      .single()

    if (updatedProfileError || !updatedProfile) {
      throw updatedProfileError ?? new Error('Não foi possível atualizar o perfil.')
    }

    await insertAdminAuditLog({
      action: 'update_user_account',
      actorUserId: actor.id,
      beforeData: {
        email: existingProfile.email,
        fullName: existingProfile.full_name,
        phone: existingProfile.phone,
        role: existingProfile.role,
        status: existingProfile.status,
      },
      afterData: {
        email: updatedProfile.email,
        fullName: updatedProfile.full_name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        status: updatedProfile.status,
      },
      entityId: updatedProfile.id,
      entityType: 'profile',
    })

    return jsonResponse({
      profileId: updatedProfile.id,
      success: true,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? translateUserManagementError(error.message)
        : typeof error === 'object' && error !== null && 'message' in error
          ? translateUserManagementError(
              String((error as { message?: unknown }).message ?? 'Erro inesperado.'),
            )
          : 'Erro inesperado.'

    const isValidationError = VALIDATION_ERRORS.includes(message)
    return jsonResponse({ error: message }, isValidationError ? 400 : 500)
  }
})
