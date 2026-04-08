import { supabase } from '@/integrations/supabase/client'
import type { AdminLogEvent } from '@/domains/logs/types'

type IntegrationLogRow = {
  created_at: string
  id: string
  integration_name: string
  message: string | null
  status: string
}

type AuditLogRow = {
  action: string
  created_at: string
  entity_type: string
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
  const [{ data: integrationLogs, error: integrationError }, { data: auditLogs, error: auditError }] =
    await Promise.all([
      client
        .from('integration_logs')
        .select('id, integration_name, status, message, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      client
        .from('admin_audit_logs')
        .select('id, action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ])

  if (integrationError) {
    throw integrationError
  }

  if (auditError) {
    throw auditError
  }

  const normalizedIntegration = ((integrationLogs ?? []) as IntegrationLogRow[]).map(
    (row) =>
      ({
        createdAt: row.created_at,
        detail: row.message,
        id: row.id,
        kind: 'integration',
        label: row.integration_name,
        secondaryLabel: row.status,
      }) satisfies AdminLogEvent,
  )

  const normalizedAudit = ((auditLogs ?? []) as AuditLogRow[]).map(
    (row) =>
      ({
        createdAt: row.created_at,
        detail: null,
        id: row.id,
        kind: 'audit',
        label: row.action,
        secondaryLabel: row.entity_type,
      }) satisfies AdminLogEvent,
  )

  return [...normalizedIntegration, ...normalizedAudit].sort((left, right) =>
    left.createdAt < right.createdAt ? 1 : left.createdAt > right.createdAt ? -1 : 0,
  )
}
