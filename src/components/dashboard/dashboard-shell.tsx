import type { PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { DashboardNavItem } from '@/components/dashboard/dashboard-quick-nav'
import { DashboardMobileHeader } from '@/components/dashboard/dashboard-mobile-header'
import { DashboardQuickNav } from '@/components/dashboard/dashboard-quick-nav'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
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

  return nestedMatch?.label ?? 'Dashboard'
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
    <div className="dashboard-theme min-h-screen bg-background text-foreground">
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
              <div className="relative h-full w-72 border-r border-border bg-card shadow-lg">
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
            <DashboardMobileHeader
              currentLabel={currentLabel}
              onMenuOpen={() => setMobileOpen(true)}
              user={user}
            />
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-3 pb-28 pt-4 md:p-6 md:pb-28 lg:p-8 lg:pb-8">
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
