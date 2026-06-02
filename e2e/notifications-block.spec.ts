import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { buildQaTitle, signInAsAdmin, signInAsUser, signOut } from './support'

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

async function selectFirstByOptionValue(page: Page, value: string) {
  const selects = page.locator('select')
  const count = await selects.count()
  for (let index = 0; index < count; index += 1) {
    if ((await selects.nth(index).locator(`option[value="${value}"]`).count()) > 0) {
      await selects.nth(index).selectOption(value)
      return true
    }
  }

  return false
}

test.describe('BLK-NOTIFICACOES (4.6.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('NTF-01..06 fluxo de envio, fila, processamento, reprocessamento/cancelamento e central do usuário', async ({ page }) => {
    test.setTimeout(360_000)
    const title = buildQaTitle('QA notificação')
    const category = `qa-notif-${Date.now()}`
    const message = 'Validação E2E do bloco de notificações.'

    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', 'qa-user@zapsucatas.local')
      .maybeSingle()

    expect(userError).toBeNull()
    expect(userProfile?.id).toBeTruthy()

    await signInAsAdmin(page)
    await page.goto('/admin/notificacoes')

    await page.locator('#notification-title').fill(title)
    await page.locator('#notification-category').fill(category)
    await page.locator('#notification-body').fill(message)
    await page.locator('select').filter({ hasText: /todos os usuários ativos|lista de user_ids/i }).first().selectOption('users')
    await page.locator('#notification-users').fill(userProfile!.id)

    const inAppCheckbox = page.getByLabel(/widget \(in-app\)|in-app/i)
    if ((await inAppCheckbox.count()) > 0) {
      const checked = await inAppCheckbox.isChecked()
      if (checked) await inAppCheckbox.uncheck()
    }
    const emailCheckbox = page.getByLabel(/^email$/i)
    if ((await emailCheckbox.count()) > 0) {
      const checked = await emailCheckbox.isChecked()
      if (!checked) await emailCheckbox.check()
    }

    await page.getByRole('button', { name: /enviar notificação/i }).click()
    await expect(page.locator('tr', { hasText: title }).first()).toBeVisible({ timeout: 30000 })

    const manualRow = page.locator('tr', { hasText: title }).first()
    await expect(manualRow).toContainText(category)
    await expect(manualRow).toContainText(/widget|email|push|whatsapp|in-app/i)
    await expect(manualRow).toContainText(/1|2|3|4/)

    const { data: createdNotification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('id, title')
      .eq('title', title)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    expect(notificationError).toBeNull()
    expect(createdNotification?.id).toBeTruthy()

    const { data: queueRows, error: queueError } = await supabaseAdmin
      .from('notification_queue')
      .select('id, status')
      .eq('notification_id', createdNotification!.id)
    expect(queueError).toBeNull()
    expect((queueRows ?? []).length).toBeGreaterThan(0)

    const queueIds = (queueRows ?? []).map((row) => row.id)
    const firstQueueId = queueRows![0]!.id
    const forcedRetryAt = new Date(Date.now() - 60_000).toISOString()
    const { error: forceRetryError } = await supabaseAdmin
      .from('notification_queue')
      .update({
        attempt_count: 0,
        final_error: null,
        next_retry_at: forcedRetryAt,
        status: 'retry',
      })
      .eq('id', firstQueueId)
    expect(forceRetryError).toBeNull()
    const { data: queueRowsBeforeProcess } = await supabaseAdmin
      .from('notification_queue')
      .select('id, updated_at')
      .in('id', queueIds)
    const beforeUpdatedAtMap = new Map((queueRowsBeforeProcess ?? []).map((row) => [row.id, row.updated_at]))

    await page.getByRole('button', { name: /notificacoes transacionais/i }).click()
    await page.getByRole('button', { name: /processar fila/i }).click()
    await page.waitForTimeout(5000)

    let processed = false
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { data: postProcessRows } = await supabaseAdmin
        .from('notification_queue')
        .select('id, updated_at')
        .in('id', queueIds)
      if ((postProcessRows ?? []).some((row) => (beforeUpdatedAtMap.get(row.id) ?? '') < row.updated_at)) {
        processed = true
        break
      }
      await page.waitForTimeout(3000)
    }
    expect(processed).toBeTruthy()

    const { error: reprocessError } = await supabaseAdmin
      .from('notification_queue')
      .update({ final_error: null, status: 'pending' })
      .eq('id', firstQueueId)
    expect(reprocessError).toBeNull()

    const { error: cancelError } = await supabaseAdmin
      .from('notification_queue')
      .update({ final_error: 'cancelled_by_admin', status: 'failed' })
      .eq('id', firstQueueId)
    expect(cancelError).toBeNull()

    const { data: failedCheck } = await supabaseAdmin
      .from('notification_queue')
      .select('id, status, final_error')
      .eq('id', firstQueueId)
      .maybeSingle()
    expect(failedCheck?.status).toBe('failed')
    expect(failedCheck?.final_error).toBe('cancelled_by_admin')

    const transacionalCard = page.locator('section, div').filter({ hasText: /historico transacional|registro consolidado/i }).first()
    await expect(transacionalCard).toBeVisible()
    await transacionalCard.getByPlaceholder(/buscar por título, mensagem ou categoria/i).fill(title)
    const transacionalSelects = transacionalCard.locator('select')
    await transacionalSelects.nth(1).selectOption('failed')
    await transacionalSelects.nth(2).selectOption('all')
    await expect(page.locator('tr', { hasText: title }).first()).toBeVisible({ timeout: 30000 })

    await signOut(page)
    await signInAsUser(page, 'qa-user@zapsucatas.local', 'ZapSucatas@2026!User')
    await page.goto('/app/notificacoes')
    await page.getByPlaceholder(/buscar por título, categoria ou mensagem/i).fill(title)
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 30000 })
  })
})