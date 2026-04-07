import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/app/paths'
import { GuardFallback } from '@/components/shared/guard-fallback'
import { useAuth } from '@/hooks/use-auth'

export function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isAuthenticated, status } = useAuth()

  if (status === 'loading') {
    return <GuardFallback title="Validando acesso" />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={paths.auth.login} />
  }

  return children ? <>{children}</> : <Outlet />
}
