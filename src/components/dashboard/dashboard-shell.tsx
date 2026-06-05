import type { PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { DashboardNavItem } from '@/components/dashboard/dashboard-quick-nav'
import { DashboardMobileHeader } from '@/components/dashboard/dashboard-mobile-header'
import { DashboardQuickNav } from '@/components/dashboard/dashboard-quick-nav'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { AppNotificationBell } from '@/components/notifications/app-notification-bell'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { useAuth } from '@/hooks/use-auth'

type DashboardShellProps = PropsWithChildren<{
  navItems: DashboardNavItem[]
  quickNavItems: DashboardNavItem[]
}>

function resolveCurrentLabel(items: DashboardNavItem[], pathname: string) {
  const exactMatch = items.find((item) => pathname === item.to)

  if (exactMatch) {
    return exactMatch.label
  }

  const nestedMatch = [...items]
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => pathname.startsWith(item.to))

  return nestedMatch?.label ?? 'Painel'
}

export function DashboardShell({
  children,
  navItems,
  quickNavItems,
}: DashboardShellProps) {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentLabel = useMemo(
    () => resolveCurrentLabel(navItems, location.pathname),
    [location.pathname, navItems],
  )

  return (
    <div className="dashboard-theme min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 bg-secondary/10">
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-0 h-screen border-r border-border bg-card">
              <DashboardSidebar items={navItems} onSignOut={signOut} user={user} />
            </div>
          </div>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                aria-label="Fechar menu"
                className="absolute inset-0 bg-slate-950/30"
                onClick={() => setMobileOpen(false)}
                type="button"
              />
              <div className="relative h-full w-[min(20rem,88vw)] border-r border-border bg-card shadow-lg">
                <DashboardSidebar
                  items={navItems}
                  onNavigate={() => setMobileOpen(false)}
                  onSignOut={signOut}
                  user={user}
                />
              </div>
            </div>
          ) : null}

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur lg:flex">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Painel do anunciante</p>
                <p className="truncate text-base font-semibold text-foreground">{currentLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <AppNotificationBell />
                <div className="max-w-[280px] rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                  <span className="font-medium uppercase tracking-[0.12em]">Conta</span>
                  <span className="ml-2 truncate font-semibold text-foreground">
                    {user?.email || 'Sessão autenticada'}
                  </span>
                </div>
              </div>
            </div>
            <DashboardMobileHeader
              currentLabel={currentLabel}
              onMenuOpen={() => setMobileOpen(true)}
              user={user}
            />
            <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col p-3 pb-28 pt-4 md:p-6 md:pb-28 lg:p-8 lg:pb-8">
              {children}
              <div className="mt-8 border-t border-border/70 pt-4">
                <BuildVersionBadge />
              </div>
            </div>
          </main>
        </div>
      </div>

      <DashboardQuickNav items={quickNavItems} />
    </div>
  )
}

