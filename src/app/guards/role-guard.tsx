import type { PropsWithChildren } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import type { AuthRole } from '@/domains/auth/types'
import { GuardFallback } from '@/components/shared/guard-fallback'
import { useAuth } from '@/hooks/use-auth'

type RoleGuardProps = PropsWithChildren<{
  allowedRoles: AuthRole[]
}>

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <GuardFallback title="Checando permissões" />
  }

  if (!user) {
    return <Navigate replace to={paths.auth.login} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getDefaultPathByRole(user.role)} />
  }

  return children ? <>{children}</> : <Outlet />
}
