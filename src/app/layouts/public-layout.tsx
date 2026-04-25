import { Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/app/paths'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { MaintenanceScreen } from '@/components/shared/maintenance-screen'
import { useAnalyticsTracker } from '@/hooks/use-analytics-tracker'
import { useSystemSettings } from '@/hooks/use-system-settings'

export function PublicLayout() {
  const location = useLocation()
  const { isLoading, maintenanceMode } = useSystemSettings()
  useAnalyticsTracker('public')
  const allowDuringMaintenance = [paths.auth.login, paths.auth.forgotPassword] as string[]

  if (!isLoading && maintenanceMode && !allowDuringMaintenance.includes(location.pathname)) {
    return (
      <MaintenanceScreen
        description="O catálogo público da Zap Sucatas está temporariamente indisponível para ajuste operacional. O acesso à conta segue liberado para administradores e contingência."
        title="Portal temporariamente em manutenção"
      />
    )
  }

  return (
    <div className="public-theme min-h-screen">
      <div className="relative min-h-screen">
        <SiteHeader />

        <main className="relative z-10 pb-20">
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 md:px-6 lg:px-8 lg:pt-8">
            <Outlet />
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
