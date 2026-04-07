import { Badge } from '@/components/ui/badge'
import type { ListingStatus } from '@/domains/listings/types'
import { cn } from '@/lib/utils'

const statusMap: Record<ListingStatus, { className: string; label: string }> = {
  approved: {
    className: 'border-emerald-300/50 bg-emerald-100 text-emerald-800',
    label: 'Aprovado',
  },
  archived: {
    className: 'border-slate-300/50 bg-slate-100 text-slate-800',
    label: 'Arquivado',
  },
  draft: {
    className: 'border-slate-300/50 bg-slate-100 text-slate-800',
    label: 'Rascunho',
  },
  expired: {
    className: 'border-zinc-300/50 bg-zinc-100 text-zinc-800',
    label: 'Expirado',
  },
  paused: {
    className: 'border-amber-300/50 bg-amber-100 text-amber-800',
    label: 'Pausado',
  },
  pending_review: {
    className: 'border-sky-300/50 bg-sky-100 text-sky-800',
    label: 'Em revisao',
  },
  rejected: {
    className: 'border-rose-300/50 bg-rose-100 text-rose-800',
    label: 'Rejeitado',
  },
}

type ListingStatusBadgeProps = {
  className?: string
  status: ListingStatus
}

export function ListingStatusBadge({ className, status }: ListingStatusBadgeProps) {
  const config = statusMap[status]

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  )
}
