import { createContext, useEffect, useState, type PropsWithChildren } from 'react'
import { loadCurrentSessionUser, resolveSessionUser, signOutFromSupabase } from '@/domains/auth/api'
import type { AuthContextValue, AuthStatus, SessionUser } from '@/domains/auth/types'
import { supabase } from '@/integrations/supabase/client'

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)

  async function refreshUser() {
    if (!supabase) {
      setUser(null)
      setStatus('unauthenticated')
      return
    }

    try {
      setStatus('loading')
      const currentUser = await loadCurrentSessionUser()
      setUser(currentUser)
      setStatus(currentUser ? 'authenticated' : 'unauthenticated')
    } catch {
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isMounted = true

    void loadCurrentSessionUser()
      .then((currentUser) => {
        if (!isMounted) {
          return
        }

        setUser(currentUser)
        setStatus(currentUser ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setUser(null)
        setStatus('unauthenticated')
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const sessionUser = await resolveSessionUser(session)
        setUser(sessionUser)
        setStatus(sessionUser ? 'authenticated' : 'unauthenticated')
      })()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    status,
    user,
    isAuthenticated: status === 'authenticated',
    isSupabaseConfigured: Boolean(supabase),
    refreshUser,
    async signOut() {
      if (!supabase) {
        setUser(null)
        setStatus('unauthenticated')
        return
      }

      await signOutFromSupabase()
      setUser(null)
      setStatus('unauthenticated')
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
