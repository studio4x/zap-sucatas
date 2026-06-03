import { requireEnv } from './env.ts'

type AsaasErrorResponse = {
  errors?: Array<{ code?: string; description?: string }>
}

function getAsaasBaseUrl() {
  const raw = Deno.env.get('ASAAS_API_URL')?.trim()
  return (raw && raw.length > 0 ? raw : 'https://api-sandbox.asaas.com/v3').replace(/\/+$/, '')
}

function extractAsaasErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const typed = payload as AsaasErrorResponse
  const first = typed.errors?.[0]

  if (first?.description && first.description.trim().length > 0) {
    return first.description.trim()
  }

  return null
}

export async function asaasRequest<T>(path: string, init?: RequestInit) {
  const apiKey = requireEnv('ASAAS_API_KEY')
  const baseUrl = getAsaasBaseUrl()
  const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      accept: 'application/json',
      access_token: apiKey,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const message = extractAsaasErrorMessage(payload) ?? `Asaas request failed with status ${response.status}.`
    throw new Error(message)
  }

  return payload as T
}

export function resolveFeaturedBillingType() {
  const raw = Deno.env.get('ASAAS_FEATURED_BILLING_TYPE')?.trim().toUpperCase()

  if (!raw) {
    return 'PIX'
  }

  const allowed = new Set(['BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'UNDEFINED'])
  return allowed.has(raw) ? raw : 'PIX'
}

export function resolveFeaturedPriceValue() {
  const raw = Deno.env.get('ASAAS_FEATURED_PRICE')?.trim()

  if (!raw) {
    return 49.9
  }

  const parsed = Number(raw.replace(',', '.'))

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Valor inválido para ASAAS_FEATURED_PRICE.')
  }

  return Number(parsed.toFixed(2))
}

export function resolveFeaturedDueDays() {
  const raw = Deno.env.get('ASAAS_FEATURED_DUE_DAYS')?.trim()

  if (!raw) {
    return 1
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 30) {
    throw new Error('Valor inválido para ASAAS_FEATURED_DUE_DAYS.')
  }

  return Math.floor(parsed)
}


