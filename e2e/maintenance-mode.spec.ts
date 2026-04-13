import { expect, test, type Page } from '@playwright/test'
import { signInAsAdmin, signInAsUser } from './support'

async function getMaintenanceSwitch(page: Page) {
  return page.locator('#maintenance-mode-switch')
}

async function setMaintenanceMode(page: Page, enabled: boolean) {
  const toggle = await getMaintenanceSwitch(page)
  const isEnabled = (await toggle.getAttribute('aria-checked')) === 'true'

  if (isEnabled !== enabled) {
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', enabled ? 'true' : 'false')
    const saveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' && response.url().includes('/rest/v1/system_settings'),
    )
    await page.getByRole('button', { name: /salvar configura/i }).click()
    await saveResponse
    await page.reload()
    await expect(await getMaintenanceSwitch(page)).toHaveAttribute(
      'aria-checked',
      enabled ? 'true' : 'false',
    )
  }
}

test.describe('maintenance mode enforcement', () => {
  test('maintenance mode blocks public and user dashboard while keeping admin access', async ({
    browser,
  }) => {
    test.skip(
      process.env.E2E_RUN_MAINTENANCE !== '1',
      'Set E2E_RUN_MAINTENANCE=1 to run the global maintenance scenario.',
    )

    const adminContext = await browser.newContext()
    const userContext = await browser.newContext()
    const publicContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const userPage = await userContext.newPage()
    const publicPage = await publicContext.newPage()

    try {
      await signInAsAdmin(adminPage)
      await adminPage.goto('/admin/configuracoes')
      await setMaintenanceMode(adminPage, true)

      await publicPage.goto('/')
      await expect
        .poll(async () => await publicPage.locator('body').innerText(), { timeout: 30000 })
        .toContain('Portal temporariamente em manutenção')

      await publicPage.goto('/login')
      await expect(publicPage.getByRole('button', { name: /^Entrar$/i })).toBeVisible()

      await signInAsUser(userPage)
      await expect
        .poll(async () => await userPage.locator('body').innerText(), { timeout: 30000 })
        .toContain('Dashboard temporariamente indisponível')

      await adminPage.goto('/admin')
      await expect(adminPage.getByText(/painel admin/i)).toBeVisible()
    } finally {
      await adminPage.goto('/admin/configuracoes')
      await setMaintenanceMode(adminPage, false)

      await Promise.allSettled([adminContext.close(), userContext.close(), publicContext.close()])
    }
  })
})
