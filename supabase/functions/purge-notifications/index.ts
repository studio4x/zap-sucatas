/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { HttpError, requireAdminProfile, resolveHttpErrorStatus } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { insertAdminAuditLog, insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'

type PurgeMode = 'delete_all' | 'purge_old'

type RequestBody = {
  job_name?: string
  mode?: PurgeMode
  trigger?: 'cron' | 'manual'
}

type RetentionSecretRow = {
  cron_key: string
  job_name: string
}

type SystemSettingsRow = {
  notification_auto_delete_enabled: boolean
  notification_retention_days: number
}

const RETENTION_JOB_NAME = 'notification_retention_cleanup'
const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

function parseRequestBody(value: unknown): RequestBody {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const candidate = value as Record<string, unknown>
  return {
    job_name: typeof candidate.job_name === 'string' ? candidate.job_name : undefined,
    mode: candidate.mode === 'delete_all' || candidate.mode === 'purge_old' ? candidate.mode : undefined,
    trigger: candidate.trigger === 'cron' || candidate.trigger === 'manual' ? candidate.trigger : undefined,
  }
}

async function validateAccess(request: Request) {
  const admin = createAdminClient()
  const cronKey = request.headers.get('x-cron-key')

  if (cronKey) {
    const { data, error } = await admin
      .from('notification_retention_secrets')
      .select('job_name, cron_key')
      .eq('job_name', RETENTION_JOB_NAME)
      .maybeSingle()

    if (error) {
      throw error
    }

    const secretRow = data as RetentionSecretRow | null

    if (!secretRow || secretRow.cron_key !== cronKey) {
      throw new HttpError('token ausente ou invalido', 401)
    }

    return { accessSource: 'cron' as const, admin, body: parseRequestBody(await request.clone().json().catch(() => ({}))) }
  }

  const actor = await requireAdminProfile(request)
  return { accessSource: 'manual' as const, actorUserId: actor.id, admin, body: parseRequestBody(await request.clone().json().catch(() => ({}))) }
}

async function readRetentionSettings(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('system_settings')
    .select('notification_auto_delete_enabled, notification_retention_days')
    .limit(1)
    .single()

  if (error || !data) {
    throw error ?? new Error('Configurações do sistema não encontradas.')
  }

  return data as SystemSettingsRow
}

async function deleteNotifications(admin: ReturnType<typeof createAdminClient>, filter: { createdBefore?: string | null; deleteAll?: boolean }) {
  let query = admin.from('notifications').delete()

  if (filter.deleteAll) {
    query = query.neq('id', ZERO_UUID)
  } else if (filter.createdBefore) {
    query = query.lt('created_at', filter.createdBefore)
  } else {
    return { count: 0 }
  }

  const { count, error } = await query.select('id', { count: 'exact' })

  if (error) {
    throw error
  }

  return { count: count ?? 0 }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const access = await validateAccess(request)
    const mode = access.body.mode ?? 'purge_old'

    if (mode === 'delete_all' && access.accessSource !== 'manual') {
      throw new HttpError('Ação administrativa obrigatória.', 403)
    }

    const admin = access.admin
    let deletedCount = 0
    let retentionDays: number | null = null

    if (mode === 'delete_all') {
      const { count } = await deleteNotifications(admin, { deleteAll: true })
      deletedCount = count

      await insertAdminAuditLog({
        action: 'notifications.delete_all',
        actorUserId: access.accessSource === 'manual' ? access.actorUserId : null,
        afterData: {
          deletedCount,
        },
        entityId: null,
        entityType: 'notifications',
      })
    } else {
      const settings = await readRetentionSettings(admin)

      if (!settings.notification_auto_delete_enabled) {
        return jsonResponse({
          deleted_count: 0,
          mode,
          success: true,
          skipped: true,
        })
      }

      retentionDays = Math.max(1, Math.min(3650, Math.trunc(settings.notification_retention_days)))
      const cutoffDate = new Date()
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - retentionDays)
      const { count } = await deleteNotifications(admin, { createdBefore: cutoffDate.toISOString() })
      deletedCount = count
    }

    await insertIntegrationLog({
      integrationName: 'notifications_retention_cleanup',
      message: mode === 'delete_all'
        ? `Exclusão total concluída com ${deletedCount} notificações.`
        : `Limpeza automática concluída com ${deletedCount} notificações.`,
      payload: {
        deletedCount,
        mode,
        retentionDays,
      },
      status: 'success',
    })

    return jsonResponse({
      deleted_count: deletedCount,
      mode,
      retention_days: retentionDays,
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    const status = resolveHttpErrorStatus(error)

    await insertIntegrationLog({
      integrationName: 'notifications_retention_cleanup',
      message,
      payload: {
        event: 'purge_notifications_failed',
      },
      status: 'error',
    })

    return jsonResponse({ error: message }, status === 500 ? 400 : status)
  }
})
