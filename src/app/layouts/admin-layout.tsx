import {
  Boxes,
  LayoutDashboard,
  Logs,
  Mailbox,
  Menu,
  MapPinned,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  Tags,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { Button } from '@/components/ui/button'

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
    to: paths.admin.contactMessages,
    label: 'Contato',
    icon: Mailbox,
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
    to: paths.admin.locations,
    label: 'Localidades',
    icon: MapPinned,
  },
  {
    to: paths.admin.blog,
    label: 'Blog',
    icon: Newspaper,
  },
  {
    to: paths.admin.pricing,
    label: 'Preços',
    icon: SlidersHorizontal,
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

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[256px_minmax(0,1fr)]">
        <div className="hidden border-r border-sidebar-border lg:block lg:h-screen lg:overflow-hidden">
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
            <div className="relative h-full w-64 border-r border-sidebar-border bg-sidebar shadow-lg">
              <AdminSidebar items={adminNavItems} onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <SquareTerminal className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Menu</p>
                <p className="text-xs text-muted-foreground">Backoffice Zap Sucatas</p>
              </div>
            </div>
            <Button onClick={() => setMobileOpen(true)} size="icon" type="button" variant="outline">
              <Menu className="size-4" />
            </Button>
          </header>

          <main className="min-h-screen overflow-x-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto flex w-full max-w-none flex-col gap-6">
              <Outlet />
              <div className="border-t border-border/70 pt-4">
                <BuildVersionBadge />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
