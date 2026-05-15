export type SystemSettings = {
  allowGuestQuestions: boolean
  blogEnabled: boolean
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
  id: string
  allowGuestQuestions: boolean
  blogEnabled: boolean
  maintenanceMode: boolean
  seoDescriptionDefault: string
  seoTitleDefault: string
  siteName: string
  supportEmail: string
  supportPhone: string
}

export type VisualAssetKind = 'favicon' | 'logoDark' | 'logoLight'

export type VisualAssetItem = {
  contentType: string | null
  name: string
  path: string
  publicUrl: string
  sizeBytes: number | null
  updatedAt: string | null
}

export type AdminVisualSettings = {
  favicon: VisualAssetItem | null
  logoDark: VisualAssetItem | null
  logoLight: VisualAssetItem | null
}
