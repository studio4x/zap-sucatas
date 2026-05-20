import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardFormSectionProps = PropsWithChildren<{
  actions?: ReactNode
  className?: string
  description?: string
  title: string
}>

export function DashboardFormSection({
  actions,
  children,
  className,
  description,
  title,
}: DashboardFormSectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl bg-card p-6 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.36),0_10px_18px_-18px_rgba(39,153,31,0.22)]',
        className,
      )}
    >
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
