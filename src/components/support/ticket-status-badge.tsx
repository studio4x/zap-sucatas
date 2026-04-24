import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { getSupportStatusMeta } from '@/lib/support-sla'
import type { SupportTicketStatus } from '@/domains/support/types'

export function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  const meta = getSupportStatusMeta(status)
  return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
}
