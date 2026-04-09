import { supabase } from '@/integrations/supabase/client'
import type { AdminLogEvent } from '@/domains/logs/types'

type IntegrationLogRow = {
  created_at: string
  id: string
  integration_name: string
  message: string | null
  payload: unknown
  status: string
}

type AuditLogRow = {
  action: string
  actor_user_id: string | null
  after_data: unknown
  before_data: unknown
  created_at: string
  entity_id: string | null
  entity_type: string
  id: string
}

type ProfileRow = {
  full_name: string
  id: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

export async function fetchAdminLogEvents() {
  const client = ensureSupabase()
  const [
    { data: integrationLogs, error: integrationError },
    { data: auditLogs, error: auditError },
    { data: profiles, error: profilesError },
  ] =
    await Promise.all([
      client
        .from('integration_logs')
        .select('id, integration_name, status, message, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(150),
      client
        .from('admin_audit_logs')
        .select('id, action, entity_type, entity_id, actor_user_id, before_data, after_data, created_at')
        .order('created_at', { ascending: false })
        .limit(150),
      client.from('profiles').select('id, full_name'),
    ])

  if (integrationError) {
    throw integrationError
  }

  if (auditError) {
    throw auditError
  }

  if (profilesError) {
    throw profilesError
  }

  const profileNames = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.full_name]),
  )

  const normalizedIntegration = ((integrationLogs ?? []) as IntegrationLogRow[]).map(
    (row) =>
      ({
        actorName: null,
        actorUserId: null,
        afterData: null,
        createdAt: row.created_at,
        detail: row.message,
        entityId: null,
        entityType: null,
        beforeData: null,
        id: row.id,
        kind: 'integration',
        label: row.integration_name,
        payload: row.payload,
        secondaryLabel: row.status,
      }) satisfies AdminLogEvent,
  )

  const normalizedAudit = ((auditLogs ?? []) as AuditLogRow[]).map(
    (row) =>
      ({
        actorName: row.actor_user_id ? profileNames.get(row.actor_user_id) ?? null : null,
        actorUserId: row.actor_user_id,
        afterData: row.after_data,
        createdAt: row.created_at,
        detail: row.entity_id,
        entityId: row.entity_id,
        entityType: row.entity_type,
        beforeData: row.before_data,
        id: row.id,
        kind: 'audit',
        label: row.action,
        payload: null,
        secondaryLabel: row.entity_type,
      }) satisfies AdminLogEvent,
  )

  return [...normalizedIntegration, ...normalizedAudit].sort((left, right) =>
    left.createdAt < right.createdAt ? 1 : left.createdAt > right.createdAt ? -1 : 0,
  )
}
