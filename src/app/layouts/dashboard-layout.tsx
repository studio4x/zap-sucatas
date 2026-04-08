import {
  CircleUserRound,
  FilePlus2,
  House,
  MessageSquareMore,
  Settings2,
  Rows4,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

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
  {
    to: paths.app.settings,
    label: 'Configuracoes',
    icon: Settings2,
  },
]

export function DashboardLayout() {
  const quickNavItems = [
    dashboardNavItems[0],
    dashboardNavItems[1],
    dashboardNavItems[2],
    dashboardNavItems[3],
    dashboardNavItems[4],
  ]

  return (
    <DashboardShell navItems={dashboardNavItems} quickNavItems={quickNavItems}>
      <Outlet />
    </DashboardShell>
  )
}
