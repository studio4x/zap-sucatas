import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminStatCardProps = {
  className?: string
  description?: string
  helper?: ReactNode
  label: string
  value: ReactNode
}

export function AdminStatCard({
  className,
  description,
  helper,
  label,
  value,
}: AdminStatCardProps) {
  return (
    <section className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <div className="mt-2 text-3xl font-semibold leading-none text-foreground">{value}</div>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {helper ? <div className="mt-3 text-xs text-muted-foreground">{helper}</div> : null}
    </section>
  )
}
