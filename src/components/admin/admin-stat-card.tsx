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
    <section
      className={cn(
        'rounded-xl bg-card p-4 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]',
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-2 whitespace-normal break-words text-3xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{value}</div>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {helper ? <div className="mt-3 text-xs text-muted-foreground">{helper}</div> : null}
    </section>
  )
}
