export type SupportTicketStatus = 'closed' | 'in_progress' | 'open'
export type SupportTicketPriority = 'high' | 'low' | 'medium' | 'urgent'
export type SupportTicketCategory = 'account' | 'general' | 'payment' | 'technical'
export type SupportSlaStatus = 'answered' | 'at_risk' | 'on_time' | 'overdue'

export type SupportSlaCategoryConfig = {
  description: string
  firstResponseHours: number
  key: SupportTicketCategory
  label: string
  position: number
}

export type SupportBusinessHoursConfig = {
  daysOfWeek: number[]
  endHour: number
  startHour: number
  timezone: string
}

export type SupportConfig = {
  businessHours: SupportBusinessHoursConfig
  categories: SupportSlaCategoryConfig[]
  crisisNote: string
  publicNote: string
}

export type SupportTicket = {
  attachmentName: string | null
  attachmentUrl: string | null
  category: SupportTicketCategory
  createdAt: string
  description: string | null
  firstResponseAt: string | null
  firstResponseDueAt: string | null
  id: string
  priority: SupportTicketPriority
  responderName: string | null
  slaPolicyKey: string
  slaStatus: SupportSlaStatus
  status: SupportTicketStatus
  subject: string
  updatedAt: string
  userId: string
}

export type SupportTicketWithUser = SupportTicket & {
  userEmail: string | null
  userFullName: string | null
}

export type SupportMessage = {
  attachmentName: string | null
  attachmentUrl: string | null
  createdAt: string
  id: string
  message: string
  senderEmail: string | null
  senderId: string
  senderName: string | null
  senderRole: 'admin' | 'user'
  ticketId: string
}

export type SupportTicketDetail = {
  messages: SupportMessage[]
  ticket: SupportTicketWithUser
}

export type SupportTicketFormValues = {
  category: SupportTicketCategory
  description: string
  priority: SupportTicketPriority
  subject: string
}
