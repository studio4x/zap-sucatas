import {
  CircleUserRound,
  ChartNoAxesColumn,
  Bell,
  Boxes,
  LayoutGrid,
  LayoutDashboard,
  Logs,
  Mailbox,
  Menu,
  MessagesSquare,
  Newspaper,
  LifeBuoy,
  BookOpenText,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  WalletCards,
  LogOut,
  SquareTerminal,
  Tags,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminNotificationBell } from '@/components/notifications/admin-notification-bell'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { AdminTutorialsProvider } from '@/domains/admin-tutorials/provider'
import { ScrollToTopOnRouteChange } from '@/components/shared/scroll-to-top-on-route-change'
import { Button } from '@/components/ui/button'
import { useAnalyticsTracker } from '@/hooks/use-analytics-tracker'
import { useAuth } from '@/hooks/use-auth'
import { useVisualFavicon } from '@/hooks/use-visual-favicon'

const adminNavItems = [
  {
    to: paths.admin.root,
    label: 'Visão geral',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: paths.admin.listings,
    label: 'Anúncios',
    icon: Boxes,
  },
  {
    to: paths.admin.questions,
    label: 'Perguntas',
    icon: MessagesSquare,
  },
  {
    to: paths.admin.users,
    label: 'Usuários',
    icon: UsersRound,
  },
  {
    to: paths.admin.tutorials,
    label: 'Tutoriais',
    icon: BookOpenText,
  },
  {
    to: paths.admin.pages,
    label: 'Páginas',
    icon: LayoutGrid,
  },
  {
    to: paths.admin.analytics,
    label: 'Estatísticas',
    icon: ChartNoAxesColumn,
  },
  {
    to: paths.admin.contactMessages,
    label: 'Contato',
    icon: Mailbox,
  },
  {
    to: paths.admin.support,
    label: 'Tickets',
    icon: LifeBuoy,
  },
  {
    to: paths.admin.notifications,
    label: 'Notificações',
    icon: Bell,
  },
  {
    to: paths.admin.categories,
    label: 'Categorias',
    icon: Tags,
  },
  {
    to: paths.admin.materials,
    label: 'Materiais',
    icon: Boxes,
  },
  {
    to: paths.admin.blog,
    label: 'Blog',
    icon: Newspaper,
  },
  {
    to: paths.admin.featuredPayments,
    label: 'Pagamentos',
    icon: WalletCards,
  },
  {
    to: paths.admin.pricing,
    label: 'Preços LME',
    icon: SlidersHorizontal,
  },
  {
    to: paths.admin.scrapPrices,
    label: 'Preço das Sucatas',
    icon: Table2,
  },
  {
    to: paths.admin.settings,
    label: 'Configurações',
    icon: ShieldCheck,
  },
  {
    to: paths.admin.logs,
    label: 'Logs',
    icon: Logs,
  },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut, user } = useAuth()
  useVisualFavicon('layout-admin')
  useAnalyticsTracker('admin')

  return (
    <AdminTutorialsProvider>
      <div className="admin-theme min-h-screen overflow-x-hidden bg-background text-foreground">
        <ScrollToTopOnRouteChange />
        <div className="lg:grid lg:min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="hidden border-r border-sidebar-border lg:block">
            <AdminSidebar items={adminNavItems} />
          </div>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                aria-label="Fechar menu"
                className="absolute inset-0 bg-slate-950/30"
                onClick={() => setMobileOpen(false)}
                type="button"
              />
              <div className="relative h-full w-[min(20rem,88vw)] border-r border-sidebar-border bg-sidebar shadow-lg">
                <AdminSidebar items={adminNavItems} onClose={() => setMobileOpen(false)} />
              </div>
            </div>
          ) : null}

          <div className="min-w-0">
            <header className="sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-border bg-card/95 px-6 shadow-sm backdrop-blur lg:flex">
              <div className="flex items-center gap-3">
                <AdminNotificationBell />
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                  <CircleUserRound className="size-4 text-primary" />
                  <span className="font-medium uppercase tracking-[0.12em] text-muted-foreground">Conta</span>
                  <span className="max-w-[240px] truncate font-semibold text-foreground">{user?.email ?? 'Sem e-mail'}</span>
                </div>
                <Button className="h-9 px-4" onClick={signOut} type="button" variant="outline">
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </div>
            </header>

            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 shadow-sm backdrop-blur lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <SquareTerminal className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Menu</p>
                  <p className="text-xs text-muted-foreground">Backoffice Zap Sucatas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminNotificationBell />
                <Button onClick={() => setMobileOpen(true)} size="icon" type="button" variant="outline">
                  <Menu className="size-4" />
                </Button>
              </div>
            </header>

            <main className="min-h-screen overflow-x-hidden p-4 md:p-6 lg:p-8">
              <div className="mx-auto flex w-[90%] max-w-none min-w-0 flex-col gap-6">
                <Outlet />
                <div className="border-t border-border/70 pt-4">
                  <BuildVersionBadge />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminTutorialsProvider>
  )
}
