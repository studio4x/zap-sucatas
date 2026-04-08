/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { requireAdminProfile } from '../_shared/auth.ts'
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

type RequestBody = CreatePayload | UpdatePayload

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

  throw new Error('Invalid role.')
}

function ensureStatus(value: unknown): UserStatus {
  if (value === 'active' || value === 'suspended' || value === 'under_review') {
    return value
  }

  throw new Error('Invalid status.')
}

function validateCreatePayload(payload: RequestBody) {
  if (payload.mode !== 'create') {
    throw new Error('Invalid mode for create.')
  }

  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  const fullName = typeof payload.fullName === 'string' ? normalizeFullName(payload.fullName) : ''
  const password = typeof payload.password === 'string' ? payload.password.trim() : ''
  const role = ensureRole(payload.role)
  const status = ensureStatus(payload.status)

  if (!email.includes('@')) {
    throw new Error('Valid email is required.')
  }

  if (fullName.length < 3) {
    throw new Error('Full name is required.')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
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
    throw new Error('Invalid mode for update.')
  }

  const profileId = typeof payload.profileId === 'string' ? payload.profileId.trim() : ''
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  const fullName = typeof payload.fullName === 'string' ? normalizeFullName(payload.fullName) : ''
  const role = ensureRole(payload.role)
  const status = ensureStatus(payload.status)

  if (profileId.length === 0) {
    throw new Error('profileId is required.')
  }

  if (!email.includes('@')) {
    throw new Error('Valid email is required.')
  }

  if (fullName.length < 3) {
    throw new Error('Full name is required.')
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const actor = await requireAdminProfile(request)
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
        throw createUserError ?? new Error('Unable to create auth user.')
      }

      const authUserId = createdUser.user.id
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .upsert({
          auth_user_id: authUserId,
          email: input.email,
          full_name: input.fullName,
          phone: input.phone,
          role: input.role,
          status: input.status,
        })
        .select('id, auth_user_id, email, full_name, phone, role, status')
        .single()

      if (profileError || !profile) {
        throw profileError ?? new Error('Unable to persist profile.')
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

    const input = validateUpdatePayload(payload)
    const { data: existingProfile, error: existingProfileError } = await admin
      .from('profiles')
      .select('id, auth_user_id, email, full_name, phone, role, status')
      .eq('id', input.profileId)
      .single()

    if (existingProfileError || !existingProfile) {
      return jsonResponse({ error: 'Profile not found.' }, 404)
    }

    if (
      existingProfile.auth_user_id === actor.auth_user_id &&
      (input.role !== 'admin' || input.status !== 'active')
    ) {
      return jsonResponse(
        { error: 'You cannot remove your own admin access or suspend your own profile.' },
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
      throw updatedProfileError ?? new Error('Unable to update profile.')
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
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
