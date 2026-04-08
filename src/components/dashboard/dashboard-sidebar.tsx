import { CircleHelp, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { DashboardNavItem } from '@/components/dashboard/dashboard-quick-nav'
import { Brand } from '@/components/navigation/brand'
import type { SessionUser } from '@/domains/auth/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DashboardSidebarProps = {
  items: DashboardNavItem[]
  onNavigate?: () => void
  onSignOut: () => Promise<void> | void
  user: SessionUser | null
}

function getStatusText(status: 'active' | 'suspended' | 'under_review') {
  if (status === 'active') {
    return 'Conta ativa'
  }

  if (status === 'suspended') {
    return 'Conta suspensa'
  }

  return 'Conta em analise'
}

export function DashboardSidebar({
  items,
  onNavigate,
  onSignOut,
  user,
}: DashboardSidebarProps) {
  return (
    <aside className="flex h-full flex-col bg-card px-4 py-5">
      <div className="border-b border-border pb-4">
        <Brand subtitle="Area do anunciante" />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">
          {user?.fullName?.trim() || 'Conta autenticada'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email || 'Sessao autenticada'}
        </p>
        <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {user ? getStatusText(user.status) : 'Aguardando sessao'}
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map(({ end, icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
            end={end}
            key={to}
            onClick={onNavigate}
            to={to}
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CircleHelp className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Precisa de ajuda?</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Atualize seus anuncios, acompanhe perguntas e use a configuracao da conta quando precisar.
            </p>
          </div>
        </div>

        <Button className="mt-4 w-full" onClick={() => void onSignOut()} type="button" variant="outline">
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
