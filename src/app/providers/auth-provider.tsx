import { createContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { AuthContextValue, AuthRole, AuthStatus, SessionUser } from '@/domains/auth/types'

const STORAGE_KEY = 'zap-sucatas:role'

const mockUsers: Record<AuthRole, SessionUser> = {
  user: {
    id: 'mock-user',
    email: 'cliente@zapsucatas.local',
    role: 'user',
  },
  admin: {
    id: 'mock-admin',
    email: 'admin@zapsucatas.local',
    role: 'admin',
  },
}

function readStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedRole = window.localStorage.getItem(STORAGE_KEY)

  if (storedRole === 'user' || storedRole === 'admin') {
    return mockUsers[storedRole]
  }

  return null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const storedUser = readStoredUser()
    setUser(storedUser)
    setStatus(storedUser ? 'authenticated' : 'unauthenticated')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || status === 'loading') {
      return
    }

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, user.role)
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  }, [status, user])

  const value: AuthContextValue = {
    status,
    user,
    isAuthenticated: status === 'authenticated',
    signInAs(role) {
      setUser(mockUsers[role])
      setStatus('authenticated')
    },
    signOut() {
      setUser(null)
      setStatus('unauthenticated')
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
