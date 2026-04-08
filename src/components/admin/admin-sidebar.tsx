import type { LucideIcon } from 'lucide-react'
import { LogOut, PanelLeftClose } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Brand } from '@/components/navigation/brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export type AdminNavItem = {
  end?: boolean
  icon: LucideIcon
  label: string
  to: string
}

type AdminSidebarProps = {
  items: AdminNavItem[]
  onClose?: () => void
}

function getRoleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Usuário'
}

export function AdminSidebar({ items, onClose }: AdminSidebarProps) {
  const { signOut, user } = useAuth()

  return (
    <aside className="flex h-full flex-col bg-sidebar px-4 py-4 text-sidebar-foreground">
      <div className="flex items-start justify-between gap-3 border-b border-sidebar-border pb-4">
        <Brand subtitle="Backoffice operacional" />
        {onClose ? (
          <button
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
            onClick={onClose}
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-sidebar-border bg-background px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Painel admin
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          Moderação, catálogo, operação de preços, conteúdo e trilha técnica do MVP.
        </p>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map(({ end, icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
              )
            }
            end={end}
            key={to}
            onClick={onClose}
            to={to}
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-lg border border-sidebar-border bg-background px-3 py-3">
        <p className="text-sm font-semibold text-foreground">
          {user?.fullName?.trim() || 'Sessão administrativa'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getRoleLabel(user?.role ?? 'user')} {user?.status === 'active' ? 'ativo' : user?.status}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email ?? 'Sem e-mail'}</p>
        <Button className="mt-4 w-full justify-center" onClick={signOut} type="button" variant="outline">
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
