export type AdminLogEvent = {
  createdAt: string
  detail: string | null
  id: string
  kind: 'audit' | 'integration'
  label: string
  secondaryLabel: string
}
