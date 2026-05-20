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
        'rounded-2xl p-6 shadow-sm',
        toneClassMap[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {icon ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
            {icon}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}
