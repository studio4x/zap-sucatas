import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminEmptyStateProps = {
  action?: ReactNode
  className?: string
  description: string
  title: string
}

export function AdminEmptyState({
  action,
  className,
  description,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className={cn('rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center shadow-sm', className)}>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
