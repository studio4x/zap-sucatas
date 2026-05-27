import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type AdminRowAction = {
  disabled?: boolean
  icon?: LucideIcon
  label: string
  onClick?: () => void
  to?: string
  variant?: 'default' | 'destructive' | 'ghost' | 'outline'
}

type AdminRowActionsProps = {
  actions: AdminRowAction[]
  compact?: boolean
}

export function AdminRowActions({ actions, compact = false }: AdminRowActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      {actions.map((action) => {
        const Icon = action.icon

        if (action.to) {
          return (
            <Button
              aria-label={action.label}
              asChild
              key={`${action.label}-${action.to}`}
              size={compact ? 'icon' : 'sm'}
              title={action.label}
              type="button"
              variant={action.variant ?? 'outline'}
            >
              <Link to={action.to}>
                {Icon ? <Icon className="size-4" /> : null}
                {compact ? <span className="sr-only">{action.label}</span> : action.label}
              </Link>
            </Button>
          )
        }

        return (
          <Button
            aria-label={action.label}
            disabled={action.disabled}
            key={action.label}
            onClick={action.onClick}
            size={compact ? 'icon' : 'sm'}
            title={action.label}
            type="button"
            variant={action.variant ?? 'outline'}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {compact ? <span className="sr-only">{action.label}</span> : action.label}
          </Button>
        )
      })}
    </div>
  )
}
