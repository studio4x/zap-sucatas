import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardAlertCardProps = {
  action?: ReactNode
  className?: string
  description: string
  title: string
  tone?: 'error' | 'info' | 'success' | 'warning'
}

const toneClassMap = {
  error: 'bg-rose-50 text-rose-900',
  info: 'bg-primary/5 text-foreground',
  success: 'bg-emerald-50 text-emerald-900',
  warning: 'bg-amber-50 text-amber-950',
}

export function DashboardAlertCard({
  action,
  className,
  description,
  title,
  tone = 'info',
}: DashboardAlertCardProps) {
  return (
    <section className={cn('rounded-2xl px-5 py-4 shadow-sm', toneClassMap[tone], className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm leading-6 opacity-90">{description}</p>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </section>
  )
}
