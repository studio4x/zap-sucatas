import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardSectionHeaderProps = {
  action?: ReactNode
  className?: string
  description: string
  title: string
}

export function DashboardSectionHeader({
  action,
  className,
  description,
  title,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  )
}
