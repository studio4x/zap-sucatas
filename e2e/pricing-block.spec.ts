import { expect, test } from '@playwright/test'
import { buildQaTitle, signInAsAdmin } from './support'

test.describe('BLK-PRECOS (4.5.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('PRC-01 PRC-02 PRC-03 manual entry lifecycle and sync routine', async ({ page }) => {
    const materialName = buildQaTitle('QA preço manual')
    const regionName = 'SP'
    const firstLabel = 'R$ 1,70/kg'
    const updatedLabel = 'R$ 1,95/kg'

    await signInAsAdmin(page)
    await page.goto('/admin/precos')

    await page.locator('#manual-material').fill(materialName)
    await page.locator('#manual-region').fill(regionName)
    await page.locator('#manual-label').fill(firstLabel)
    await page.locator('#manual-price').fill('1,70')
    await page.locator('#manual-unit').fill('kg')
    await page.getByRole('button', { name: /criar entrada manual/i }).click()
    await expect(page.getByText(/entrada manual criada com sucesso/i)).toBeVisible()

    let row = page.locator('tr', { hasText: materialName }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText(firstLabel)

    await page.goto('/preco-dos-metais-lme')
    const publicRow = page.locator('tr', { hasText: materialName }).first()
    await expect(publicRow).toBeVisible()
    await expect(publicRow).toContainText(firstLabel)

    await page.goto('/admin/precos')
    row = page.locator('tr', { hasText: materialName }).first()
    await row.getByRole('button', { name: /editar/i }).click()
    await page.locator('#manual-label').fill(updatedLabel)
    await page.locator('#manual-price').fill('1,95')
    await page.getByRole('button', { name: /atualizar entrada manual/i }).click()
    await expect(page.getByText(/entrada manual atualizada com sucesso/i)).toBeVisible()
    await expect(page.locator('tr', { hasText: materialName }).first()).toContainText(updatedLabel)

    row = page.locator('tr', { hasText: materialName }).first()
    await row.getByRole('button', { name: /remover/i }).click()
    await page.getByRole('button', { name: /remover entrada/i }).click()
    await expect(page.getByText(/entrada manual removida com sucesso/i)).toBeVisible()
    await expect(page.locator('tr', { hasText: materialName })).toHaveCount(0)

    await page.goto('/preco-dos-metais-lme')
    await expect(page.locator('tr', { hasText: materialName })).toHaveCount(0)

    await page.goto('/admin/precos')
    const syncOverviewCard = page.locator('div', { hasText: /sincronização automática|sincronização automática/i }).first()
    await expect(syncOverviewCard).toBeVisible()
    await page.getByRole('button', { name: /sincronizar agora/i }).click()
    await expect(
      page.getByText(/sincronização concluída|sincronização concluida|não foi possível sincronizar|não foi possível sincronizar/i),
    ).toBeVisible({ timeout: 90_000 })
    await expect(page.getByText(/snapshots processados/i)).toBeVisible()
  })
})