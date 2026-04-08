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
}

export function AdminRowActions({ actions }: AdminRowActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      {actions.map((action) => {
        const Icon = action.icon

        if (action.to) {
          return (
            <Button asChild key={`${action.label}-${action.to}`} size="sm" type="button" variant={action.variant ?? 'outline'}>
              <Link to={action.to}>
                {Icon ? <Icon className="size-4" /> : null}
                {action.label}
              </Link>
            </Button>
          )
        }

        return (
          <Button
            disabled={action.disabled}
            key={action.label}
            onClick={action.onClick}
            size="sm"
            type="button"
            variant={action.variant ?? 'outline'}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
