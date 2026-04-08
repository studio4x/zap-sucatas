import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PublicSectionHeadingProps = {
  actions?: ReactNode
  className?: string
  description: string
  eyebrow?: string
  title: string
}

export function PublicSectionHeading({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PublicSectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
