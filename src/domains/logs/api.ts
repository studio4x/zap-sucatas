import { supabase } from '@/integrations/supabase/client'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
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

type LogFeedRow = {
  actor_user_id: string | null
  after_data: unknown
  before_data: unknown
  created_at: string
  detail: string | null
  entity_id: string | null
  entity_type: string | null
  id: string
  kind: 'audit' | 'integration'
  label: string
  payload: unknown
  secondary_label: string
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

export async function fetchAdminLogStats() {
  const client = ensureSupabase()
  const [
    { count: totalCount, error: totalError },
    { count: integrationCount, error: integrationError },
    { count: auditCount, error: auditError },
    { count: errorCount, error: errorCountError },
  ] = await Promise.all([
    client.from('admin_log_feed').select('id', { count: 'exact', head: true }),
    client.from('integration_logs').select('id', { count: 'exact', head: true }),
    client.from('admin_audit_logs').select('id', { count: 'exact', head: true }),
    client.from('integration_logs').select('id', { count: 'exact', head: true }).in('status', ['error', 'failed', 'blocked']),
  ])

  if (totalError || integrationError || auditError || errorCountError) {
    throw totalError ?? integrationError ?? auditError ?? errorCountError ?? new Error('Falha ao carregar os indicadores de logs.')
  }

  return {
    audits: auditCount ?? 0,
    integrations: integrationCount ?? 0,
    total: totalCount ?? 0,
    withErrors: errorCount ?? 0,
  }
}

export async function fetchAdminLogEventsPage(input: {
  entityType?: string
  kind?: 'all' | 'audit' | 'integration'
  page: number
  pageSize: number
  query?: string
}): Promise<PaginatedResult<AdminLogEvent>> {
  const client = ensureSupabase()
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = client
    .from('admin_log_feed')
    .select(
      'id, kind, label, secondary_label, detail, actor_user_id, entity_type, entity_id, before_data, after_data, payload, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (input.kind && input.kind !== 'all') {
    query = query.eq('kind', input.kind)
  }

  if (input.entityType && input.entityType !== 'all') {
    query = query.eq('entity_type', input.entityType)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    query = query.or(`label.ilike.${search},secondary_label.ilike.${search},detail.ilike.${search},entity_id.ilike.${search}`)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  const rows = (data ?? []) as LogFeedRow[]
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((value): value is string => Boolean(value)))]
  const profileNames = new Map<string, string>()

  if (actorIds.length > 0) {
    const { data: profiles, error: profilesError } = await client.from('profiles').select('id, full_name').in('id', actorIds)

    if (profilesError) {
      throw profilesError
    }

    ;((profiles ?? []) as ProfileRow[]).forEach((profile) => {
      profileNames.set(profile.id, profile.full_name)
    })
  }

  return {
    items: rows.map(
      (row) =>
        ({
          actorName: row.actor_user_id ? profileNames.get(row.actor_user_id) ?? null : null,
          actorUserId: row.actor_user_id,
          afterData: row.after_data,
          beforeData: row.before_data,
          createdAt: row.created_at,
          detail: row.detail,
          entityId: row.entity_id,
          entityType: row.entity_type,
          id: row.id,
          kind: row.kind,
          label: row.label,
          payload: row.payload,
          secondaryLabel: row.secondary_label,
        }) satisfies AdminLogEvent,
    ),
    totalCount: count ?? 0,
  }
}
