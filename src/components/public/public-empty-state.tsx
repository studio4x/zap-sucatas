import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type PublicEmptyStateProps = {
  action?: ReactNode
  description: string
  icon?: LucideIcon
  title: string
}

export function PublicEmptyState({
  action,
  description,
  icon: Icon = Inbox,
  title,
}: PublicEmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/80 px-6 py-10 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary text-primary/80">
        <Icon className="size-7" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
