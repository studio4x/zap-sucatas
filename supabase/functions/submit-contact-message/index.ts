/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import nodemailer from 'npm:nodemailer@6.10.1'
import { getBearerToken } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type RequestBody = {
  companyWebsite?: string
  email?: string
  fullName?: string
  message?: string
  phone?: string
  subject?: string
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeOptionalPhone(value: string | undefined) {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')

  return forwardedFor?.split(',')[0]?.trim() || realIp || cfIp || 'unknown'
}

async function resolveOptionalProfileId(request: Request) {
  try {
    const token = await getBearerToken(request)
    const admin = createAdminClient()
    const {
      data: { user },
    } = await admin.auth.getUser(token)

    if (!user?.id) {
      return null
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    return profile?.id ?? null
  } catch {
    return null
  }
}

function validatePayload(payload: RequestBody) {
  const fullName = typeof payload.fullName === 'string' ? normalizeText(payload.fullName) : ''
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const subject = typeof payload.subject === 'string' ? normalizeText(payload.subject) : ''
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''

  if (fullName.length < 3) {
    throw new Error('Informe seu nome completo.')
  }

  if (!email.includes('@')) {
    throw new Error('Informe um e-mail válido.')
  }

  if (subject.length < 3) {
    throw new Error('Informe um assunto objetivo para o contato.')
  }

  if (message.length < 10) {
    throw new Error('Descreva sua mensagem com um pouco mais de detalhe.')
  }

  return {
    email,
    fullName,
    message,
    phone: normalizeOptionalPhone(payload.phone),
    subject,
  }
}

async function sendContactConfirmationEmail(input: { email: string; fullName: string; subject: string }) {
  const host = Deno.env.get('SMTP_HOST')
  const password = Deno.env.get('SMTP_PASSWORD')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  if (!host || !password || !emailFrom) {
    return
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
    secure: (Deno.env.get('SMTP_SECURE') ?? 'true').toLowerCase() === 'true',
    auth: { user: Deno.env.get('SMTP_USER') ?? emailFrom, pass: password },
  })
  await transporter.sendMail({
    from: `${Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas'} <${emailFrom}>`,
    to: input.email,
    subject: 'Recebemos sua mensagem - Zap Sucatas',
    text: `Ola ${input.fullName}, recebemos sua mensagem sobre "${input.subject}". Nossa equipe retornara em breve.`,
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const payload = (await request.json()) as RequestBody

    if (typeof payload.companyWebsite === 'string' && payload.companyWebsite.trim().length > 0) {
      return jsonResponse({ success: true })
    }

    const admin = createAdminClient()
    const requestIp = getRequestIp(request)
    const profileId = await resolveOptionalProfileId(request)
    const input = validatePayload(payload)

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count, error: throttleError } = await admin
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('request_ip', requestIp)
      .gte('created_at', tenMinutesAgo)

    if (throttleError) {
      throw throttleError
    }

    if ((count ?? 0) >= 3) {
      await insertIntegrationLog({
        integrationName: 'contact_form',
        message: 'Rate limit exceeded for contact submission.',
        payload: {
          email: input.email,
          event: 'contact_rate_limited',
          requestIp,
          severity: 'warning',
          subject: input.subject,
        },
        status: 'blocked',
      })
      return jsonResponse(
        { error: 'Muitas tentativas em sequência. Aguarde alguns minutos antes de enviar novamente.' },
        429,
      )
    }

    const { error: insertError } = await admin.from('contact_messages').insert({
      email: input.email,
      full_name: input.fullName,
      message: input.message,
      phone: input.phone,
      profile_id: profileId,
      request_ip: requestIp,
      subject: input.subject,
      user_agent: request.headers.get('user-agent'),
    })

    if (insertError) {
      throw insertError
    }
    await sendContactConfirmationEmail({
      email: input.email,
      fullName: input.fullName,
      subject: input.subject,
    })
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .eq('status', 'active')
    for (const adminProfile of admins ?? []) {
      await enqueueTransactionalNotification({
        actionUrl: '/admin/contato',
        body: `Nova mensagem de contato recebida de ${input.fullName}: ${input.subject}`,
        category: 'contact',
        title: 'Novo contato recebido',
        userId: adminProfile.id,
      })
    }

    await insertIntegrationLog({
      integrationName: 'contact_form',
      message: 'Contact message submitted successfully.',
      payload: {
        email: input.email,
        event: 'contact_message_submitted',
        profileId,
        requestIp,
        severity: 'success',
        subject: input.subject,
      },
      status: 'success',
    })

    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    await insertIntegrationLog({
      integrationName: 'contact_form',
      message,
      payload: {
        event: 'contact_message_failed',
        severity: 'danger',
      },
      status: 'error',
    })
    return jsonResponse({ error: message }, 400)
  }
})
