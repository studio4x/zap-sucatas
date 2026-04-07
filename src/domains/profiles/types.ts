import type { AuthRole } from '@/domains/auth/types'

export type ProfileStatus = 'active' | 'suspended' | 'under_review'

export type Profile = {
  authUserId: string
  createdAt: string
  fullName: string
  id: string
  isAdmin: boolean
  phone: string | null
  role: AuthRole
  status: ProfileStatus
  updatedAt: string
}
