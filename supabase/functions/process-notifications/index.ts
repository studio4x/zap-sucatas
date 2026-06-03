/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import nodemailer from 'npm:nodemailer@6.10.1'
import { requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { renderBrandedEmail } from '../_shared/email-template.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { computeNextRetryAt, isQuietHoursActive, shouldRetry } from '../_shared/notifications.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type QueueRow = {
  attempt_count: number
  body: string
  category: string
  channel: 'email' | 'in-app' | 'push' | 'whatsapp'
  id: string
  next_retry_at: string
  notification_id: string
  payload: Record<string, unknown> | null
  priority: 'high' | 'low' | 'normal' | 'urgent'
  title: string
  user_id: string
}

type PreferenceRow = {
  email_enabled: boolean
  email_digest: 'daily' | 'immediate' | 'never' | 'weekly'
  in_app_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_end: string | null
  quiet_hours_start: string | null
  quiet_hours_timezone: string | null
  push_enabled: boolean
  user_id: string
  whatsapp_enabled: boolean
}

type ProfileRow = {
  email: string | null
  id: string
  phone: string | null
}

const MAX_BATCH = 150

function getSmtpConfig() {
  const host = Deno.env.get('SMTP_HOST')
  const password = Deno.env.get('SMTP_PASSWORD')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  if (!host || !password || !emailFrom) {
    return null
  }

  return {
    emailFrom,
    emailFromName: Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas',
    host,
    password,
    port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
    secure: (Deno.env.get('SMTP_SECURE') ?? 'true').toLowerCase() === 'true',
    user: Deno.env.get('SMTP_USER') ?? emailFrom,
  }
}

function channelEnabledForPreference(channel: QueueRow['channel'], preference: PreferenceRow | null) {
  if (!preference) {
    return true
  }

  if (channel === 'push') {
    return preference.push_enabled
  }

  if (channel === 'email') {
    return preference.email_enabled && preference.email_digest !== 'never'
  }

  if (channel === 'whatsapp') {
    return preference.whatsapp_enabled
  }

  return preference.in_app_enabled
}

function canDeliverByProfile(channel: QueueRow['channel'], profile: ProfileRow | null) {
  if (!profile) {
    return false
  }

  if (channel === 'email') {
    return Boolean(profile.email)
  }

  if (channel === 'whatsapp') {
    return Boolean(profile.phone)
  }

  return true
}

function allowByQuietHours(channel: QueueRow['channel'], preference: PreferenceRow | null) {
  if (!preference || channel === 'in-app') {
    return true
  }

  return !isQuietHoursActive({
    enabled: preference.quiet_hours_enabled,
    end: preference.quiet_hours_end,
    start: preference.quiet_hours_start,
    timezone: preference.quiet_hours_timezone,
  })
}

async function validateProcessorAccess(request: Request) {
  const cronSecret = Deno.env.get('NOTIFICATION_CRON_SECRET')
  const cronHeader = request.headers.get('x-cron-key')

  if (cronSecret && cronHeader && cronHeader === cronSecret) {
    return { actor: 'cron' as const }
  }

  const actor = await requireAdminProfile(request)
  return { actor: 'admin' as const, profileId: actor.id }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    await validateProcessorAccess(request)
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()

    const { data: queueRowsRaw, error: queueError } = await admin
      .from('notification_queue')
      .select('*')
      .in('status', ['pending', 'retry'])
      .lte('next_retry_at', nowIso)
      .order('created_at', { ascending: true })
      .limit(MAX_BATCH)

    if (queueError) {
      throw queueError
    }

    const queueRows = (queueRowsRaw ?? []) as QueueRow[]

    if (queueRows.length === 0) {
      return jsonResponse({ failed: 0, processed: 0, retrying: 0, sent: 0, success: true })
    }

    const userIds = Array.from(new Set(queueRows.map((row) => row.user_id)))
    const [preferencesResult, profilesResult] = await Promise.all([
      admin
        .from('notification_preferences')
        .select('*')
        .in('user_id', userIds),
      admin
        .from('profiles')
        .select('id, email, phone')
        .in('id', userIds),
    ])

    if (preferencesResult.error) {
      throw preferencesResult.error
    }

    if (profilesResult.error) {
      throw profilesResult.error
    }

    const preferenceMap = new Map((preferencesResult.data ?? []).map((row) => [row.user_id, row as PreferenceRow]))
    const profileMap = new Map((profilesResult.data ?? []).map((row) => [row.id, row as ProfileRow]))

    let sent = 0
    let failed = 0
    let retrying = 0

    for (const queueRow of queueRows) {
      const attempt = queueRow.attempt_count + 1
      const preference = preferenceMap.get(queueRow.user_id) ?? null
      const profile = profileMap.get(queueRow.user_id) ?? null

      let nextStatus: 'delivered' | 'failed' | 'retry' | 'sent' = 'sent'
      let errorMessage: string | null = null
      let providerMessageId: string | null = null
      let deliveredAt: string | null = null

      if (!channelEnabledForPreference(queueRow.channel, preference)) {
        nextStatus = 'failed'
        errorMessage = 'canal_desativado_pelo_usuario'
      } else if (!allowByQuietHours(queueRow.channel, preference)) {
        nextStatus = 'retry'
        errorMessage = 'quiet_hours_ativo'
      } else if (!canDeliverByProfile(queueRow.channel, profile)) {
        nextStatus = shouldRetry(attempt) ? 'retry' : 'failed'
        errorMessage = queueRow.channel === 'email' ? 'email_nao_configurado' : 'telefone_nao_configurado'
      } else {
        if (queueRow.channel === 'email') {
          const smtp = getSmtpConfig()
          if (!smtp || !profile?.email) {
            nextStatus = shouldRetry(attempt) ? 'retry' : 'failed'
            errorMessage = 'smtp_nao_configurado_ou_destinatario_invalido'
          } else {
            try {
              const transporter = nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                auth: { user: smtp.user, pass: smtp.password },
              })
              const response = await transporter.sendMail({
                from: `${smtp.emailFromName} <${smtp.emailFrom}>`,
                to: profile.email,
                subject: queueRow.title,
                html: (
                  await renderBrandedEmail({
                    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">${queueRow.body}</p>`,
                    footerText: 'Zap Sucatas · Este e-mail foi enviado automaticamente pela plataforma.',
                    title: queueRow.title,
                  })
                ).html,
                text: queueRow.body,
              })
              providerMessageId = response.messageId ?? `${queueRow.channel}-${crypto.randomUUID()}`
              deliveredAt = new Date().toISOString()
              nextStatus = 'sent'
            } catch (smtpError) {
              nextStatus = shouldRetry(attempt) ? 'retry' : 'failed'
              errorMessage =
                smtpError instanceof Error && smtpError.message.trim().length > 0
                  ? `smtp_send_failed:${smtpError.message}`
                  : 'smtp_send_failed'
            }
          }
        } else {
          providerMessageId = `${queueRow.channel}-${crypto.randomUUID()}`
          deliveredAt = new Date().toISOString()
          nextStatus = queueRow.channel === 'in-app' ? 'delivered' : 'sent'
        }
      }

      if (nextStatus === 'retry' && !shouldRetry(attempt)) {
        nextStatus = 'failed'
      }

      const nextRetryAt = nextStatus === 'retry' ? computeNextRetryAt(attempt) : new Date().toISOString()

      const { error: updateError } = await admin
        .from('notification_queue')
        .update({
          attempt_count: attempt,
          final_error: nextStatus === 'retry' ? null : errorMessage,
          last_attempt_at: new Date().toISOString(),
          next_retry_at: nextRetryAt,
          provider_message_id: providerMessageId,
          status: nextStatus,
        })
        .eq('id', queueRow.id)

      if (updateError) {
        throw updateError
      }

      const { error: deliveryLogError } = await admin
        .from('notification_delivery_logs')
        .insert({
          attempt_number: attempt,
          channel: queueRow.channel,
          delivered_at: deliveredAt,
          error_message: errorMessage,
          queue_id: queueRow.id,
          response_status_code: nextStatus === 'retry' || nextStatus === 'failed' ? 422 : 200,
          retry_attempt: Math.max(attempt - 1, 0),
          status: nextStatus === 'retry' || nextStatus === 'failed' ? 'failure' : 'success',
        })

      if (deliveryLogError) {
        throw deliveryLogError
      }

      if (nextStatus === 'retry') {
        retrying += 1
      } else if (nextStatus === 'failed') {
        failed += 1
      } else {
        sent += 1
      }
    }

    await insertIntegrationLog({
      integrationName: 'notifications_queue_processor',
      message: `Queue processed: ${queueRows.length}`,
      payload: {
        failed,
        processed: queueRows.length,
        retrying,
        sent,
      },
      status: failed > 0 ? 'warning' : 'success',
    })

    return jsonResponse({
      failed,
      processed: queueRows.length,
      retrying,
      sent,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : 'Erro inesperado.'
    const status = resolveHttpErrorStatus(error)

    await insertIntegrationLog({
      integrationName: 'notifications_queue_processor',
      message,
      payload: {
        event: 'queue_processing_failed',
      },
      status: 'error',
    })

    return jsonResponse({ error: message }, status)
  }
})

