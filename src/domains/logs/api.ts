import { supabase } from '@/integrations/supabase/client'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
import type { AdminLogEvent } from '@/domains/logs/types'

type ProfileRow = {
  full_name: string
  id: string
}

type LogFeedRow = {
  action_key: string | null
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
  secondary_label: string | null
  severity: string | null
  source_name: string | null
}

type IntegrationLogRow = {
  created_at: string
  id: string
  integration_name: string
  message: string | null
  payload: unknown
  status: string
}

type AdminOperationalHealth = {
  auditEvents24h: number
  contactMessages24h: number
  errors24h: number
  latestIntegrationEvent: IntegrationLogRow | null
  latestPricingSync: IntegrationLogRow | null
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function normalizeSeverity(value: string | null | undefined, fallback = ''): AdminLogEvent['severity'] {
  const normalized = (value ?? fallback).toLowerCase()

  if (normalized.includes('danger') || normalized.includes('error') || normalized.includes('fail') || normalized.includes('blocked')) {
    return 'danger'
  }

  if (normalized.includes('success') || normalized.includes('ok')) {
    return 'success'
  }

  if (normalized.includes('warn')) {
    return 'warning'
  }

  return 'info'
}

function mapLogEvent(row: LogFeedRow, profileNames: Map<string, string>) {
  return {
    actionKey: row.action_key,
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
    secondaryLabel: row.secondary_label ?? '',
    severity: normalizeSeverity(row.severity, row.secondary_label ?? ''),
    sourceName: row.source_name,
  } satisfies AdminLogEvent
}

async function fetchProfileNames(actorIds: string[]) {
  if (actorIds.length === 0) {
    return new Map<string, string>()
  }

  const { data, error } = await ensureSupabase()
    .from('profiles')
    .select('id, full_name')
    .in('id', actorIds)

  if (error) {
    throw error
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.full_name]))
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
    client.from('admin_log_feed').select('id', { count: 'exact', head: true }).eq('severity', 'danger'),
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

export async function fetchAdminOperationalHealth(): Promise<AdminOperationalHealth> {
  const client = ensureSupabase()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: errors24h, error: errorsError },
    { count: contactMessages24h, error: contactsError },
    { count: auditEvents24h, error: auditsError },
    { data: latestPricingSync, error: pricingError },
    { data: latestIntegrationEvent, error: integrationError },
  ] = await Promise.all([
    client
      .from('integration_logs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['error', 'failed', 'blocked'])
      .gte('created_at', since),
    client
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since),
    client
      .from('admin_audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since),
    client
      .from('integration_logs')
      .select('id, integration_name, status, message, payload, created_at')
      .eq('integration_name', 'lme')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('integration_logs')
      .select('id, integration_name, status, message, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (errorsError || contactsError || auditsError || pricingError || integrationError) {
    throw errorsError ?? contactsError ?? auditsError ?? pricingError ?? integrationError ?? new Error('Falha ao carregar o resumo operacional.')
  }

  return {
    auditEvents24h: auditEvents24h ?? 0,
    contactMessages24h: contactMessages24h ?? 0,
    errors24h: errors24h ?? 0,
    latestIntegrationEvent: (latestIntegrationEvent as IntegrationLogRow | null) ?? null,
    latestPricingSync: (latestPricingSync as IntegrationLogRow | null) ?? null,
  }
}

export async function fetchAdminLogEventsPage(input: {
  entityType?: string
  kind?: 'all' | 'audit' | 'integration'
  page: number
  pageSize: number
  query?: string
  severity?: 'all' | AdminLogEvent['severity']
  source?: string
}): Promise<PaginatedResult<AdminLogEvent>> {
  const client = ensureSupabase()
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = client
    .from('admin_log_feed')
    .select(
      'id, kind, label, secondary_label, detail, actor_user_id, entity_type, entity_id, before_data, after_data, payload, created_at, severity, source_name, action_key',
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

  if (input.severity && input.severity !== 'all') {
    query = query.eq('severity', input.severity)
  }

  if (input.source && input.source !== 'all') {
    query = query.eq('source_name', input.source)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    query = query.or(
      `label.ilike.${search},secondary_label.ilike.${search},detail.ilike.${search},entity_id.ilike.${search},source_name.ilike.${search},action_key.ilike.${search}`,
    )
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  const rows = (data ?? []) as LogFeedRow[]
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((value): value is string => Boolean(value)))]
  const profileNames = await fetchProfileNames(actorIds)

  return {
    items: rows.map((row) => mapLogEvent(row, profileNames)),
    totalCount: count ?? 0,
  }
}