import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type DashboardNavItem = {
  end?: boolean
  icon: LucideIcon
  label: string
  shortLabel?: string
  to: string
}

type DashboardQuickNavProps = {
  items: DashboardNavItem[]
}

export function DashboardQuickNav({ items }: DashboardQuickNavProps) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="grid grid-cols-5 rounded-2xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur-xl">
        {items.map(({ end, icon: Icon, label, shortLabel, to }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
            end={end}
            key={to}
            to={to}
          >
            <Icon className="size-4" />
            <span className="truncate">{shortLabel ?? label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
