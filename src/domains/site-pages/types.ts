export type SitePageSource = 'site_pages' | 'system_settings'

export type SitePageDefinition = {
  description: string
  key: string
  path: string
  section: string
  sortOrder: number
  source: SitePageSource
  title: string
}

export type AdminSitePageRecord = SitePageDefinition & {
  id: string
  isOnline: boolean
  updatedAt: string
}
