import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Browser } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { buildQaTitle, signInAsAdmin, signInAsUser } from './support'

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

async function withRolePage<T>(browser: Browser, run: (page: Awaited<ReturnType<Browser['newPage']>>) => Promise<T>) {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    return await run(page)
  } finally {
    await context.close()
  }
}

test.describe('BLK-SUPORTE-TICKETS (4.7.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('SUP-01..05 fluxo completo de abertura, resposta, SLA e encerramento', async ({ browser }) => {
    test.setTimeout(240_000)

    const subject = buildQaTitle('QA ticket suporte')
    const description = 'Fluxo E2E: abertura de chamado pelo usuário.'
    const userMessage = 'Mensagem adicional do usuário no chamado.'
    const adminMessage = 'Resposta da equipe administrativa no chamado.'

    const ticketId = await withRolePage(browser, async (page) => {
      await signInAsUser(page)
      await page.goto('/app/suporte')
      await page.getByRole('button', { name: /novo chamado/i }).click()
      await page.getByRole('button', { name: /abrir um chamado/i }).click()
      await page.locator('#support-category').selectOption('general')
      await page.locator('#support-subject').fill(subject)
      await page.locator('#support-priority').selectOption('medium')
      await page.locator('#support-description').fill(description)
      await page.getByRole('button', { name: /enviar chamado/i }).click()

      await expect(page).toHaveURL(/\/app\/suporte\/[a-f0-9-]+$/i, { timeout: 30000 })
      await expect(page.getByRole('heading', { name: subject })).toBeVisible()
      await expect(page.getByText(description)).toBeVisible()

      const userTicketUrl = page.url()
      const id = userTicketUrl.split('/').pop() ?? ''
      expect(id.length).toBeGreaterThan(20)

      await page.getByPlaceholder(/escreva sua mensagem/i).fill(userMessage)
      await page.getByRole('button', { name: /^enviar$/i }).click()
      await expect(page.getByText(userMessage)).toBeVisible({ timeout: 30000 })

      return id
    })

    await withRolePage(browser, async (page) => {
      await signInAsAdmin(page)
      await page.goto(`/admin/suporte/${ticketId}`)
      await expect(page.getByRole('heading', { name: subject })).toBeVisible()
      await page.getByPlaceholder(/escreva sua mensagem/i).fill(adminMessage)
      await page.getByRole('button', { name: /^enviar$/i }).click()
      await expect(page.getByText(adminMessage)).toBeVisible({ timeout: 30000 })

      let firstResponseRecorded = false
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabaseAdmin
          .from('support_tickets')
          .select('first_response_at, sla_status, status')
          .eq('id', ticketId)
          .maybeSingle()

        if (data?.first_response_at) {
          firstResponseRecorded = true
          expect(typeof data.sla_status).toBe('string')
          break
        }
        await page.waitForTimeout(1500)
      }
      expect(firstResponseRecorded).toBeTruthy()

      await page.locator('select').first().selectOption('in_progress')
      await expect(page.locator('select').first()).toHaveValue('in_progress')
      await page.locator('select').first().selectOption('closed')
      await expect(page.locator('select').first()).toHaveValue('closed')
    })

    const { data: closedTicket } = await supabaseAdmin
      .from('support_tickets')
      .select('status')
      .eq('id', ticketId)
      .maybeSingle()
    expect(closedTicket?.status).toBe('closed')

    await withRolePage(browser, async (page) => {
      await signInAsUser(page)
      await page.goto(`/app/suporte/${ticketId}`)
      await expect(page.getByText(adminMessage)).toBeVisible({ timeout: 30000 })
      await expect(page.getByText(/este chamado foi encerrado/i)).toBeVisible()
      await expect(page.getByPlaceholder(/chamado encerrado pelo suporte/i)).toBeDisabled()
    })
  })
})
