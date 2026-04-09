export type AdminLogEvent = {
  actorName: string | null
  actorUserId: string | null
  afterData: unknown
  createdAt: string
  entityId: string | null
  entityType: string | null
  beforeData: unknown
  detail: string | null
  id: string
  kind: 'audit' | 'integration'
  label: string
  payload: unknown
  secondaryLabel: string
}
