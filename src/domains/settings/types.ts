export type SystemSettings = {
  allowGuestQuestions: boolean
  createdAt: string
  id: string
  maintenanceMode: boolean
  seoDescriptionDefault: string | null
  seoTitleDefault: string | null
  siteName: string
  supportEmail: string | null
  supportPhone: string | null
  updatedAt: string
}

export type AdminAuditLog = {
  action: string
  actorUserId: string | null
  afterData: unknown
  beforeData: unknown
  createdAt: string
  entityId: string | null
  entityType: string
  id: string
}

export type IntegrationLog = {
  createdAt: string
  id: string
  integrationName: string
  message: string | null
  payload: unknown
  status: string
}

export type UpdateSystemSettingsInput = {
  allowGuestQuestions: boolean
  maintenanceMode: boolean
  seoDescriptionDefault: string
  seoTitleDefault: string
  siteName: string
  supportEmail: string
  supportPhone: string
}
