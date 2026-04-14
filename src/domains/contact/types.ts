export type ContactMessageStatus = 'new' | 'read' | 'resolved'

export type ContactMessage = {
  createdAt: string
  email: string
  fullName: string
  id: string
  message: string
  phone: string | null
  profileId: string | null
  requestIp: string | null
  source: string
  status: ContactMessageStatus
  subject: string
  updatedAt: string
  userAgent: string | null
}

export type AdminContactMessageStats = {
  newMessages: number
  readMessages: number
  resolvedMessages: number
  total: number
}
