export type AuthRole = 'admin' | 'user'

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated'

export type ProfileStatus = 'active' | 'suspended' | 'under_review'

export type SessionUser = {
  email: string
  fullName: string | null
  id: string
  profileId: string | null
  role: AuthRole
  status: ProfileStatus
}

export type AuthContextValue = {
  isAuthenticated: boolean
  isSupabaseConfigured: boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
  status: AuthStatus
  user: SessionUser | null
}
