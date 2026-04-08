export type PricingSeriesCode = 'AL' | 'CU' | 'NI' | 'PB' | 'SN' | 'USD' | 'ZN'

export type PricingSyncMode = 'backfill' | 'latest'

export type ScrapPriceEntry = {
  createdAt: string
  effectiveDate: string
  id: string
  isActive: boolean
  materialName: string
  priceLabel: string
  priceNumeric: number | null
  priceUnit: string | null
  regionName: string | null
  sourceType: string
  updatedAt: string
}

export type LmePriceSnapshot = {
  createdAt: string
  currencyCode: string
  id: string
  metalCode: PricingSeriesCode
  metalName: string
  priceValue: number
  providerName: string
  quotedAt: string
  quotedDate: string
  sourcePayload: unknown
}

export type PricingPeriodOption = {
  lastQuotedDate: string
  monthKey: string
  monthLabel: string
  monthStart: string
  tradingDays: number
}

export type PricingChartPoint = {
  quotedDate: string
  value: number
}

export type PricingChartSeries = {
  code: PricingSeriesCode
  color: string
  label: string
  points: PricingChartPoint[]
}

export type PricingTableRowType = 'daily' | 'period_average' | 'weekly_average'

export type PricingTableRow = {
  label: string
  quotedDate: string | null
  rowType: PricingTableRowType
  values: Partial<Record<PricingSeriesCode, number>>
  weekLabel: string | null
}

export type PricingPageData = {
  chartSeries: PricingChartSeries[]
  historyRows: PricingTableRow[]
  lastManualUpdate: string | null
  latestQuotedDate: string | null
  latestValues: Partial<Record<PricingSeriesCode, number>>
  manualEntries: ScrapPriceEntry[]
  periods: PricingPeriodOption[]
  selectedMonthKey: string | null
  snapshotCount: number
}

export type PricingAdminDashboard = PricingPageData & {
  recentSnapshots: LmePriceSnapshot[]
}

export type UpsertScrapPriceEntryInput = {
  effectiveDate: string
  id?: string
  isActive: boolean
  materialName: string
  priceLabel: string
  priceNumeric: string
  priceUnit: string
  regionName: string
}

export type ManualSnapshotSeriesValues = Record<PricingSeriesCode, string>

export type SaveManualLmeSnapshotsInput = {
  providerName?: string
  quotedDate: string
  values: ManualSnapshotSeriesValues
}

export type PricingSyncResult = {
  inserted: number
  mode: PricingSyncMode
  providers: string[]
  success: boolean
}
