import { Badge } from '@/components/ui/badge'
import type { QuestionStatus } from '@/domains/questions/types'
import { cn } from '@/lib/utils'

const statusMap: Record<QuestionStatus, { className: string; label: string }> = {
  blocked: {
    className: 'border-rose-300/50 bg-rose-100 text-rose-800',
    label: 'Bloqueada',
  },
  hidden: {
    className: 'border-amber-300/50 bg-amber-100 text-amber-800',
    label: 'Oculta',
  },
  published: {
    className: 'border-emerald-300/50 bg-emerald-100 text-emerald-800',
    label: 'Publicada',
  },
}

type QuestionStatusBadgeProps = {
  className?: string
  status: QuestionStatus
}

export function QuestionStatusBadge({ className, status }: QuestionStatusBadgeProps) {
  const config = statusMap[status]

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  )
}
