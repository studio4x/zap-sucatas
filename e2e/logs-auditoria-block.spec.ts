import { expect, test } from '@playwright/test'
import { buildQaTitle, signInAsAdmin } from './support'

test.describe('BLK-LOGS-AUDITORIA (4.11.2)', () => {
  test('LOG-01..03 operacoes criticas, rastros e coerencia de logs', async ({ page }) => {
    test.setTimeout(240_000)

    const title = buildQaTitle('QA log notif')
    const category = `qa-log-${Date.now()}`

    await signInAsAdmin(page)

    await test.step('LOG-01: executar operacao critica de envio', async () => {
      await page.goto('/admin/notificacoes')
      await page.locator('#notification-title').fill(title)
      await page.locator('#notification-category').fill(category)
      await page.locator('#notification-body').fill('Envio administrativo para validar trilha de logs.')
      await page.locator('select').filter({ hasText: /todos os usuarios ativos|lista de user_ids/i }).first().selectOption('all')
      await page.getByRole('button', { name: /enviar notificacao/i }).click()
      await expect(page.locator('tr', { hasText: title }).first()).toBeVisible({ timeout: 30000 })
    })

    await test.step('LOG-02 e LOG-03: validar rastros em /admin/logs e coerencia de status/payload', async () => {
      await page.goto('/admin/logs')
      await expect(page.getByText(/carregando dados operacionais/i)).not.toBeVisible({ timeout: 30000 })

      let foundAuditEvent = false
      const rowActions = page.locator('tbody tr button:has-text("Detalhar")')
      await expect(rowActions.first()).toBeVisible({ timeout: 30000 })
      const actionCount = Math.min(await rowActions.count(), 12)
      expect(actionCount).toBeGreaterThan(0)
      for (let index = 0; index < actionCount; index += 1) {
        await rowActions.nth(index).click()
        const dialog = page.locator('div.fixed.inset-0').last()
        const isAudit = (await dialog.getByText('Auditoria', { exact: true }).count()) > 0
        const hasAction = (await dialog.getByText(/notifications\.broadcast_send/i).count()) > 0
        await page.getByRole('button', { name: 'Fechar', exact: true }).click()
        if (isAudit && hasAction) {
          foundAuditEvent = true
          break
        }
      }
      expect(foundAuditEvent).toBeTruthy()

      let foundIntegrationEvent = false
      for (let index = 0; index < actionCount; index += 1) {
        await rowActions.nth(index).click()
        const dialog = page.locator('div.fixed.inset-0').last()
        const isIntegration = (await dialog.getByText('Integracao', { exact: true }).count()) > 0
        const hasQueuedCount = (await dialog.getByText(/queuedCount/i).count()) > 0
        const hasNotificationCount = (await dialog.getByText(/notificationCount/i).count()) > 0
        await page.getByRole('button', { name: 'Fechar', exact: true }).click()
        if (isIntegration && hasQueuedCount && hasNotificationCount) {
          foundIntegrationEvent = true
          break
        }
      }
      expect(foundIntegrationEvent).toBeTruthy()
    })
  })
})
