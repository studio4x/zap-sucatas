import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminPageHeaderProps = {
  actions?: ReactNode
  className?: string
  description: string
  eyebrow?: string
  title: string
}

export function AdminPageHeader({
  actions,
  className,
  description,
  eyebrow = 'Admin',
  title,
}: AdminPageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[30px] md:leading-none">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions ? <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end [&>*]:w-full sm:[&>*]:w-auto">{actions}</div> : null}
    </header>
  )
}
