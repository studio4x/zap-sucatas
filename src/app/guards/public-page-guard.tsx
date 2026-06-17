import type { ReactNode } from 'react'
import { paths } from '@/app/paths'
import { PageUnavailableScreen } from '@/components/shared/page-unavailable-screen'
import { RouteLoadingScreen } from '@/components/shared/route-loading-screen'
import { usePublicSitePages } from '@/hooks/use-public-site-pages'

type PublicPageGuardProps = {
  children: ReactNode
  pagePath: string
  pageTitle: string
}

export function PublicPageGuard({ children, pagePath, pageTitle }: PublicPageGuardProps) {
  const { isLoading, isPageOnline } = usePublicSitePages()

  if (isLoading) {
    return <RouteLoadingScreen />
  }

  if (!isPageOnline(pagePath)) {
    return (
      <PageUnavailableScreen
        description={`A página ${pageTitle} está temporariamente offline para ajustes operacionais.`}
        showHomeLink={pagePath !== paths.public.home}
        title={`${pageTitle} offline`}
      />
    )
  }

  return <>{children}</>
}
