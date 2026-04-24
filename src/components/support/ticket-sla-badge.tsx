import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { getSupportSlaStatusMeta } from '@/lib/support-sla'
import type { SupportTicket } from '@/domains/support/types'

export function TicketSlaBadge({ status }: { status: SupportTicket['slaStatus'] }) {
  const meta = getSupportSlaStatusMeta(status)
  return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
}
