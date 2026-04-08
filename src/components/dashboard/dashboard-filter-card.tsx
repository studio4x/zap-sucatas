import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardFilterCardProps = PropsWithChildren<{
  actions?: ReactNode
  className?: string
  description?: string
  title?: string
}>

export function DashboardFilterCard({
  actions,
  children,
  className,
  description,
  title = 'Filtros',
}: DashboardFilterCardProps) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
