import {
  Boxes,
  LayoutDashboard,
  Logs,
  MapPinned,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UsersRound,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AppShell } from '@/components/layout/app-shell'

const adminNavItems = [
  {
    to: paths.admin.root,
    label: 'Visao geral',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: paths.admin.listings,
    label: 'Anuncios',
    icon: Boxes,
  },
  {
    to: paths.admin.questions,
    label: 'Perguntas',
    icon: MessagesSquare,
  },
  {
    to: paths.admin.users,
    label: 'Usuarios',
    icon: UsersRound,
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
    label: 'Precos',
    icon: SlidersHorizontal,
  },
  {
    to: paths.admin.logs,
    label: 'Logs',
    icon: Logs,
  },
]

export function AdminLayout() {
  return (
    <AppShell
      description="Painel administrativo para moderacao, catalogo, blog, precos e operacao."
      navItems={adminNavItems}
      title="Painel admin"
      tone="admin"
      topIcon={ShieldCheck}
    >
      <Outlet />
    </AppShell>
  )
}
