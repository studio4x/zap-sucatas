export type AuthRole = 'admin' | 'user'

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated'

export type SessionUser = {
  email: string
  id: string
  role: AuthRole
}

export type AuthContextValue = {
  isAuthenticated: boolean
  signInAs: (role: AuthRole) => void
  signOut: () => void
  status: AuthStatus
  user: SessionUser | null
}
