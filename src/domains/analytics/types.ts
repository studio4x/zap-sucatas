export type AnalyticsPeriodPreset = '30d' | '7d' | '90d' | 'custom'

export type AnalyticsFilter = {
  endAt: string
  startAt: string
}

export type AnalyticsSeriesPoint = {
  date: string
  value: number
}

export type AnalyticsTopItem = {
  label: string
  value: number
}

export type AnalyticsOverview = {
  accessCount: number
  avgNavigationSeconds: number
  clickCount: number
  ctr: number
  deviceMix: AnalyticsTopItem[]
  localityMix: AnalyticsTopItem[]
  loggedUserEvents: number
  newUsers: number
  recurringUsers: number
  topClickTargets: AnalyticsTopItem[]
  topPages: AnalyticsTopItem[]
  uniqueSessions: number
  viewsByDay: AnalyticsSeriesPoint[]
}
