import {
  CircleUserRound,
  FilePlus2,
  House,
  MessageSquareMore,
  PackageSearch,
  Rows4,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AppShell } from '@/components/layout/app-shell'

const dashboardNavItems = [
  {
    to: paths.app.root,
    label: 'Visao geral',
    icon: House,
    end: true,
  },
  {
    to: paths.app.listings,
    label: 'Anuncios',
    icon: Rows4,
  },
  {
    to: paths.app.newListing,
    label: 'Novo anuncio',
    icon: FilePlus2,
  },
  {
    to: paths.app.questions,
    label: 'Perguntas',
    icon: MessageSquareMore,
  },
  {
    to: paths.app.profile,
    label: 'Perfil',
    icon: CircleUserRound,
  },
]

export function DashboardLayout() {
  return (
    <AppShell
      description="Area autenticada preparada para operacao do anunciante no MVP."
      navItems={dashboardNavItems}
      title="Dashboard do anunciante"
      tone="user"
      topIcon={PackageSearch}
    >
      <Outlet />
    </AppShell>
  )
}
