import { Outlet } from 'react-router-dom'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'

export function PublicLayout() {
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
