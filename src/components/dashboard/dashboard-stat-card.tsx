import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardStatCardProps = {
  className?: string
  description?: string
  icon?: ReactNode
  label: string
  tone?: 'default' | 'success' | 'warning'
  value: ReactNode
}

const toneClassMap = {
  default: 'bg-card',
  success: 'bg-emerald-50/80',
  warning: 'bg-amber-50/80',
}

export function DashboardStatCard({
  className,
  description,
  icon,
  label,
  tone = 'default',
  value,
}: DashboardStatCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border p-5 shadow-sm',
        toneClassMap[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="text-3xl font-bold leading-none text-foreground">{value}</div>
        </div>
        {icon ? (
          <div className="flex size-10 items-center justify-center rounded-xl bg-background text-primary">
            {icon}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </section>
  )
}
