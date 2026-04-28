import type { LucideIcon } from 'lucide-react'
import { LogOut, PanelLeftClose } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { Button } from '@/components/ui/button'
import { fetchAdminNotificationQueueStats } from '@/domains/notifications/api'
import { fetchAdminSupportTickets } from '@/domains/support/api'
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
  const supportQueueQuery = useQuery({
    queryKey: ['support', 'admin', 'sidebar-summary'],
    queryFn: fetchAdminSupportTickets,
    staleTime: 30_000,
  })
  const unresolvedTickets = (supportQueueQuery.data ?? []).filter((ticket) => ticket.status !== 'closed').length
  const overdueTickets = (supportQueueQuery.data ?? []).filter((ticket) => ticket.slaStatus === 'overdue').length
  const notificationStatsQuery = useQuery({
    queryKey: ['notifications', 'admin', 'sidebar-stats'],
    queryFn: fetchAdminNotificationQueueStats,
    staleTime: 30_000,
  })
  const pendingNotifications = (notificationStatsQuery.data?.pending ?? 0) + (notificationStatsQuery.data?.retrying ?? 0)

  return (
    <aside className="flex h-full flex-col bg-sidebar px-4 py-4 text-sidebar-foreground">
      <div className="flex items-start justify-between gap-3 border-b border-sidebar-border pb-4">
        <Brand layout="stacked" subtitle="Backoffice operacional" />
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

      <div className="mt-4 rounded-[1rem] border border-sidebar-border bg-background/92 px-3 py-3 shadow-[0_12px_30px_-24px_rgba(19,33,23,0.18)]">
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
                'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary !text-white shadow-sm [&_svg]:!text-white'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
              )
            }
            end={end}
            key={to}
            onClick={onClose}
            to={to}
          >
            <Icon className="size-4" />
            <span className="truncate">{label}</span>
            {to === paths.admin.support && unresolvedTickets > 0 ? (
              <span
                className={cn(
                  'ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  overdueTickets > 0 ? 'bg-white/18 text-white ring-1 ring-white/25' : 'bg-sidebar-accent text-foreground',
                )}
              >
                {unresolvedTickets}
              </span>
            ) : null}
            {to === paths.admin.notifications && pendingNotifications > 0 ? (
              <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {pendingNotifications > 99 ? '99+' : pendingNotifications}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {overdueTickets > 0 ? (
        <div className="mt-3 rounded-[1rem] border border-[#e7c1b9] bg-[#fff5f2] px-3 py-3 text-xs text-[#8f3326] shadow-[0_12px_30px_-24px_rgba(143,51,38,0.22)]">
          <p className="font-semibold uppercase tracking-[0.14em]">SLA em atraso</p>
          <p className="mt-2 leading-5">
            {overdueTickets} chamado{overdueTickets > 1 ? 's' : ''} precisa{overdueTickets > 1 ? 'm' : ''} de primeira resposta.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-[1rem] border border-sidebar-border bg-background/92 px-3 py-3 shadow-[0_12px_30px_-24px_rgba(19,33,23,0.18)]">
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
