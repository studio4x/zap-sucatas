import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/app/paths'
import { GuardFallback } from '@/components/shared/guard-fallback'
import { useAuth } from '@/hooks/use-auth'

export function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isAuthenticated, status, user } = useAuth()

  if (status === 'loading') {
    return <GuardFallback title="Validando acesso" />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={paths.auth.login} />
  }

  if (user?.status === 'under_review') {
    return (
      <GuardFallback
        description="Seu perfil foi criado, mas ainda nao esta liberado para uso operacional."
        loading={false}
        title="Perfil em analise"
      />
    )
  }

  if (user?.status === 'suspended') {
    return (
      <GuardFallback
        description="Seu acesso foi suspenso. Entre em contato com a administracao para revisar a conta."
        loading={false}
        title="Acesso suspenso"
      />
    )
  }

  return children ? <>{children}</> : <Outlet />
}
