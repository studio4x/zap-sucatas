import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminFilterCardProps = PropsWithChildren<{
  actions?: ReactNode
  className?: string
  description?: string
  title?: string
}>

export function AdminFilterCard({
  actions,
  children,
  className,
  description,
  title = 'Filtros',
}: AdminFilterCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl bg-card p-4 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]',
        className,
      )}
    >
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
