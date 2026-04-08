import type { AuthRole } from '@/domains/auth/types'

export type ProfileStatus = 'active' | 'suspended' | 'under_review'

export type Profile = {
  authUserId: string
  createdAt: string
  email: string | null
  fullName: string
  id: string
  isAdmin: boolean
  phone: string | null
  role: AuthRole
  status: ProfileStatus
  updatedAt: string
}

export type AdminProfileSummary = Profile & {
  approvedListings: number
  authoredQuestions: number
  totalListings: number
}

export type ManageAdminUserPayload = {
  email: string
  fullName: string
  password?: string
  phone: string
  profileId?: string
  role: AuthRole
  status: ProfileStatus
}
