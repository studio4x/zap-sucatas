import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardEmptyStateProps = {
  action?: ReactNode
  className?: string
  description: string
  icon?: LucideIcon
  title: string
}

export function DashboardEmptyState({
  action,
  className,
  description,
  icon: Icon = Inbox,
  title,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Icon className="size-6 opacity-60" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
