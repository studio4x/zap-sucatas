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
  metalCode: string
  metalName: string
  priceValue: number
  quotedAt: string
  sourcePayload: unknown
}
