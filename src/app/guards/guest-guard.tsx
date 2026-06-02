import type { PropsWithChildren } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getDefaultPathByRole } from '@/app/paths'
import { GuardFallback } from '@/components/shared/guard-fallback'
import { useAuth } from '@/hooks/use-auth'

export function GuestGuard({ children }: PropsWithChildren) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <GuardFallback title="Preparando autenticação" />
  }

  if (user) {
    return <Navigate replace to={getDefaultPathByRole(user.role)} />
  }

  return children ? <>{children}</> : <Outlet />
}