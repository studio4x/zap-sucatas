export type SystemSettings = {
  adminNotificationEmail: string | null
  allowGuestQuestions: boolean
  blogEnabled: boolean
  createdAt: string
  featuredPaymentsEnabled: boolean
  footerLogoScalePercent: number
  headerLogoScalePercent: number
  id: string
  maintenanceMode: boolean
  notificationAutoDeleteEnabled: boolean
  notificationRetentionDays: number
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
  adminNotificationEmail: string
  id: string
  allowGuestQuestions: boolean
  blogEnabled: boolean
  featuredPaymentsEnabled: boolean
  footerLogoScalePercent: number
  headerLogoScalePercent: number
  maintenanceMode: boolean
  seoDescriptionDefault: string
  seoTitleDefault: string
  siteName: string
  supportEmail: string
  supportPhone: string
}

export type UpdateNotificationRetentionSettingsInput = {
  enabled: boolean
  id: string
  retentionDays: number
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
