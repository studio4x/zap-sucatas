import { expect, test } from '@playwright/test'
import { buildQaEmail, buildQaTitle, searchForText, signIn, signInAsAdmin } from './support'

test.describe('admin user management', () => {
  test.describe.configure({ mode: 'serial' })

  test('admin can create, edit, reset password and delete a user account', async ({ browser, page }) => {
    const initialName = buildQaTitle('QA usuario')
    const updatedName = `${initialName} revisado`
    const initialEmail = buildQaEmail('qa-user-admin-flow')
    const updatedEmail = buildQaEmail('qa-user-admin-flow-updated')
    const initialPassword = 'ZapSucatas@2026!Flow1'
    const resetPassword = 'ZapSucatas@2026!Reset1'

    await signInAsAdmin(page)
    await page.goto('/admin/usuarios')

    await page.locator('#create-full-name').fill(initialName)
    await page.locator('#create-email').fill(initialEmail)
    await page.locator('#create-phone').fill('(11) 98888-0001')
    await page.locator('#create-role').selectOption('user')
    await page.locator('#create-status').selectOption('active')
    await page.locator('#create-password').fill(initialPassword)
    await page.locator('#create-confirm-password').fill(initialPassword)
    await page.getByRole('button', { name: /criar usu[aá]rio/i }).click()
    await expect(page.getByText(/usu[aá]rio criado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome, e-mail ou telefone/i, initialEmail)
    let row = page.locator('tr', { hasText: initialEmail }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /editar/i }).click()
    await page.locator('#edit-full-name').fill(updatedName)
    await page.locator('#edit-email').fill(updatedEmail)
    await page.locator('#edit-phone').fill('(11) 97777-0002')
    await page.locator('#edit-status').selectOption('under_review')
    await page.getByRole('button', { name: /salvar ajustes/i }).click()
    await expect(page.getByText(/usu[aá]rio atualizado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome, e-mail ou telefone/i, updatedEmail)
    row = page.locator('tr', { hasText: updatedEmail }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText(/em an[aá]lise/i)

    await row.getByRole('button', { name: /editar/i }).click()
    await page.locator('#edit-status').selectOption('active')
    await page.getByRole('button', { name: /salvar ajustes/i }).click()
    await expect(page.getByText(/usu[aá]rio atualizado com sucesso/i)).toBeVisible()

    await row.getByRole('button', { name: /senha/i }).click()
    await page.locator('#reset-password').fill(resetPassword)
    await page.locator('#reset-confirm-password').fill(resetPassword)
    await page.getByRole('button', { name: /redefinir senha/i }).click()
    await expect(page.getByText(/senha redefinida com sucesso/i)).toBeVisible()

    const userContext = await browser.newContext()
    const userPage = await userContext.newPage()

    try {
      await signIn(userPage, updatedEmail, resetPassword)
      await expect(userPage).toHaveURL(/\/app(\/|$)/, { timeout: 30000 })
    } finally {
      await userContext.close()
    }

    await searchForText(page, /buscar por nome, e-mail ou telefone/i, updatedEmail)
    row = page.locator('tr', { hasText: updatedEmail }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /excluir/i }).click()
    await page.getByRole('button', { name: /excluir usu[aá]rio/i }).click()
    await expect(page.getByText(/usu[aá]rio exclu[ií]do com sucesso/i)).toBeVisible()
    await expect(page.locator('tr', { hasText: updatedEmail })).toHaveCount(0)
  })
})
