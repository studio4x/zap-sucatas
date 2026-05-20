import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardActionCardProps = {
  action?: ReactNode
  className?: string
  description: string
  eyebrow?: string
  icon?: ReactNode
  tone?: 'default' | 'primary' | 'success' | 'warning'
  title: string
}

const toneClassMap = {
  default: 'bg-card',
  primary: 'bg-primary/5',
  success: 'bg-emerald-50/80',
  warning: 'bg-amber-50/80',
}

export function DashboardActionCard({
  action,
  className,
  description,
  eyebrow,
  icon,
  tone = 'default',
  title,
}: DashboardActionCardProps) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-2xl p-6 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.38),0_10px_20px_-20px_rgba(39,153,31,0.24)]',
        toneClassMap[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="break-words text-lg font-semibold text-foreground [overflow-wrap:anywhere]">{title}</h2>
          <p className="break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{description}</p>
        </div>
        {icon ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-[0_10px_18px_-14px_rgba(0,0,0,0.3)]">
            {icon}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}
