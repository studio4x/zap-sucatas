import {
  CircleUserRound,
  FilePlus2,
  House,
  MessageSquareMore,
  Rows4,
  Settings2,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { paths } from '@/app/paths'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MaintenanceScreen } from '@/components/shared/maintenance-screen'
import { useAuth } from '@/hooks/use-auth'
import { useSystemSettings } from '@/hooks/use-system-settings'

const dashboardNavItems = [
  {
    to: paths.app.root,
    label: 'Visão geral',
    icon: House,
    end: true,
  },
  {
    to: paths.app.listings,
    label: 'Anúncios',
    icon: Rows4,
  },
  {
    to: paths.app.newListing,
    label: 'Novo anúncio',
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
    label: 'Configurações',
    icon: Settings2,
  },
]

export function DashboardLayout() {
  const { user } = useAuth()
  const { isLoading, maintenanceMode } = useSystemSettings()
  const quickNavItems = [
    dashboardNavItems[0],
    dashboardNavItems[1],
    dashboardNavItems[2],
    dashboardNavItems[3],
    dashboardNavItems[4],
  ]

  if (!isLoading && maintenanceMode && user?.role !== 'admin') {
    return (
      <MaintenanceScreen
        description="Seu painel está temporariamente indisponível enquanto finalizamos um ajuste operacional na plataforma. Assim que a manutenção terminar, o acesso será restabelecido automaticamente."
        title="Dashboard temporariamente indisponível"
        tone="dashboard"
      />
    )
  }

  return (
    <DashboardShell navItems={dashboardNavItems} quickNavItems={quickNavItems}>
      <Outlet />
    </DashboardShell>
  )
}
