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
  default: 'bg-primary',
  success: 'bg-primary',
  warning: 'bg-primary',
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
        'rounded-2xl p-5 shadow-sm',
        toneClassMap[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/90">{label}</p>
          <div className="text-3xl font-bold leading-none text-white">{value}</div>
        </div>
        {icon ? (
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white">
            {icon}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-white/90">{description}</p>
      ) : null}
    </section>
  )
}
