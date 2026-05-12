export type AdminFeaturedPaymentItem = {
  amount: number
  asaasPaymentId: string
  billingType: string
  createdAt: string
  dueDate: string | null
  id: string
  invoiceUrl: string | null
  listing: {
    id: string
    slug: string | null
    status: string | null
    title: string
  }
  paidAt: string | null
  status: 'pending' | 'paid' | 'expired' | 'canceled' | 'failed'
  user: {
    id: string
    name: string
  }
}

export type AsaasIntegrationValidation = {
  config: {
    asaasEnvironment: 'production' | 'sandbox'
    apiKeyConfigured: boolean
    apiUrl: string
    billingType: string
    dueDays: number
    featuredPrice: number
    webhookUrl: string
    webhookTokenConfigured: boolean
  }
  connectivity: {
    errorMessage?: string
    ok: boolean
    testedAt: string
  }
  success: boolean
}
