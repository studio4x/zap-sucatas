import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { signInAsAdmin, signInAsUser } from './support'

function readLocalEnv(name: string) {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const text = fs.readFileSync(envPath, 'utf-8')
  const line = text
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${name}=`))

  if (!line) {
    throw new Error(`Missing ${name} in .env.local`)
  }

  return line.slice(name.length + 1).trim()
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? readLocalEnv('VITE_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? readLocalEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function toIsoDay(value: Date) {
  return value.toISOString().slice(0, 10)
}

async function readCardNumber(page: Page, label: string) {
  const labelNode = page.locator('section p', { hasText: new RegExp(`^${label}$`, 'i') }).first()
  await expect(labelNode).toBeVisible()
  const valueText = await labelNode.locator('xpath=following-sibling::div[1]').textContent()
  const match = valueText?.match(/(\d+(?:[.,]\d+)?)/)
  return match ? Number(match[1].replace(',', '.')) : NaN
}

async function emitAnalyticsEvent(page: Page, input: {
  eventType: 'click' | 'page_leave' | 'page_view'
  pathname: string
  target?: string
}) {
  const result = await page.evaluate(
    async ({ eventType, pathname, target, supabaseUrl, supabaseAnonKey }) => {
      const payload = {
        duration_ms: eventType === 'page_leave' ? 1800 : null,
        event_type: eventType,
        language: navigator.language,
        pathname,
        referrer: document.referrer || null,
        session_id: `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        target: target ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_agent: navigator.userAgent,
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      })

      return { ok: response.ok, status: response.status }
    },
    {
      eventType: input.eventType,
      pathname: input.pathname,
      target: input.target ?? null,
      supabaseAnonKey: readLocalEnv('VITE_SUPABASE_ANON_KEY'),
      supabaseUrl: SUPABASE_URL,
    },
  )

  expect(result.ok).toBeTruthy()
}

test.describe('BLK-ANALYTICS (4.8.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('ANL-01..04 gerar eventos, validar persistência, filtros e consistência dos KPIs', async ({ browser, page }) => {
    test.setTimeout(240_000)
    const { count: beforeCount } = await supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })

    await page.goto('/')
    await page.waitForTimeout(800)
    await emitAnalyticsEvent(page, { eventType: 'page_view', pathname: '/' })
    await emitAnalyticsEvent(page, { eventType: 'click', pathname: '/', target: 'public:hero-cta' })
    await page.getByRole('link', { name: /anúncios|anuncios/i }).first().click()
    await page.waitForTimeout(800)
    await page.goto('/anuncios')
    await page.waitForTimeout(800)
    await emitAnalyticsEvent(page, { eventType: 'page_view', pathname: '/anuncios' })
    await page.goto('/sobre')
    await page.waitForTimeout(800)
    await emitAnalyticsEvent(page, { eventType: 'page_leave', pathname: '/anuncios' })

    const userContext = await browser.newContext()
    const userPage = await userContext.newPage()
    await signInAsUser(userPage)
    await userPage.goto('/app/notificacoes')
    await userPage.waitForTimeout(3000)
    await emitAnalyticsEvent(userPage, { eventType: 'page_view', pathname: '/app/notificacoes' })
    await userContext.close()

    await signInAsAdmin(page)
    await page.goto('/admin/estatisticas')
    await page.waitForTimeout(3000)
    await emitAnalyticsEvent(page, { eventType: 'page_view', pathname: '/admin/estatisticas' })

    let persistedRows: Array<{ created_at: string; event_type: string; pathname: string }> = []
    let persistedError: { message?: string } | null = null
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const result = await supabaseAdmin
        .from('analytics_events')
        .select('event_type, pathname, created_at')
        .order('created_at', { ascending: false })
        .limit(400)
      persistedError = result.error
      persistedRows = (result.data ?? []) as Array<{ created_at: string; event_type: string; pathname: string }>
      if ((persistedRows.length > 0) && persistedRows.length > (beforeCount ?? 0)) {
        break
      }
      await page.waitForTimeout(2000)
    }

    expect(persistedError).toBeNull()
    expect((persistedRows ?? []).length).toBeGreaterThan(beforeCount ?? 0)
    const eventTypes = new Set((persistedRows ?? []).map((row) => row.event_type))
    expect(eventTypes.has('page_view')).toBeTruthy()
    const pathnames = new Set((persistedRows ?? []).map((row) => row.pathname))
    expect(Array.from(pathnames).some((value) => value === '/' || value === '/anuncios' || value.startsWith('/app') || value.startsWith('/admin'))).toBeTruthy()

    const today = toIsoDay(new Date())
    await page.locator('input[type="date"]').nth(0).fill(today)
    await page.locator('input[type="date"]').nth(1).fill(today)
    await page.waitForTimeout(1500)

    const uiAcessos = await readCardNumber(page, 'Acessos')
    const uiCliques = await readCardNumber(page, 'Cliques')
    const uiCtr = await readCardNumber(page, 'CTR')
    expect(Number.isNaN(uiAcessos)).toBeFalsy()
    expect(Number.isNaN(uiCliques)).toBeFalsy()
    expect(Number.isNaN(uiCtr)).toBeFalsy()
    expect(uiAcessos).toBeGreaterThan(0)
    expect(uiCliques).toBeGreaterThanOrEqual(0)
    const expectedCtr = uiAcessos > 0 ? Number(((uiCliques / uiAcessos) * 100).toFixed(2)) : 0
    expect(Math.abs(uiCtr - expectedCtr)).toBeLessThanOrEqual(1)

    const future = new Date()
    future.setDate(future.getDate() + 5)
    const futureDay = toIsoDay(future)
    await page.locator('input[type="date"]').nth(0).fill(futureDay)
    await page.locator('input[type="date"]').nth(1).fill(futureDay)
    await page.waitForTimeout(1500)
    await expect(
      page.getByText(/sem dados para o período selecionado|sem eventos de acesso no período|top páginas indisponível/i).first(),
    ).toBeVisible()
  })
})
