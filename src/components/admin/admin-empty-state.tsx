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
    <div
      className={cn(
        'rounded-lg bg-card px-6 py-10 text-center shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
