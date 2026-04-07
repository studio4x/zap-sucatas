import { createAdminClient } from './supabase.ts'

export async function insertAdminAuditLog(input: {
  action: string
  actorUserId: string | null
  afterData?: unknown
  beforeData?: unknown
  entityId?: string | null
  entityType: string
}) {
  const admin = createAdminClient()

  await admin.from('admin_audit_logs').insert({
    action: input.action,
    actor_user_id: input.actorUserId,
    after_data: input.afterData ?? null,
    before_data: input.beforeData ?? null,
    entity_id: input.entityId ?? null,
    entity_type: input.entityType,
  })
}

export async function insertIntegrationLog(input: {
  integrationName: string
  message?: string | null
  payload?: unknown
  status: string
}) {
  const admin = createAdminClient()

  await admin.from('integration_logs').insert({
    integration_name: input.integrationName,
    message: input.message ?? null,
    payload: input.payload ?? null,
    status: input.status,
  })
}
