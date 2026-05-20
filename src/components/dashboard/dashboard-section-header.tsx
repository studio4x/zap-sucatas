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
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </div>
  )
}
