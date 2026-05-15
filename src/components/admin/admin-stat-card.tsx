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
    <section className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-2 whitespace-normal break-words text-3xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{value}</div>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {helper ? <div className="mt-3 text-xs text-muted-foreground">{helper}</div> : null}
    </section>
  )
}
