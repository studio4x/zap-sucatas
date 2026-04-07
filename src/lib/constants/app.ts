export const listingStatuses = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'paused',
  'archived',
  'expired',
] as const

export const questionStatuses = ['published', 'hidden', 'blocked'] as const

export const blogPostStatuses = ['draft', 'published', 'archived'] as const

export const profileStatuses = ['active', 'suspended', 'under_review'] as const

export const userRoles = ['user', 'admin'] as const
