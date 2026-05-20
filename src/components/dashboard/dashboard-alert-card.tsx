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
    <section
      className={cn(
        'rounded-2xl px-5 py-4 shadow-[0_16px_30px_-26px_rgba(0,0,0,0.36),0_8px_16px_-16px_rgba(39,153,31,0.22)]',
        toneClassMap[tone],
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm leading-6 opacity-90">{description}</p>
        </div>
        {action ? <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
      </div>
    </section>
  )
}
