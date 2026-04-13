import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail').first().fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /^Entrar$/i }).click()
}

test.describe('authenticated smoke', () => {
  test('user credentials reach the dashboard shell', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL
    const password = process.env.E2E_USER_PASSWORD

    test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run user smoke.')

    await signIn(page, email ?? '', password ?? '')

    await expect(page).toHaveURL(/\/app(\/|$)/)
    await expect(page.getByText(/visao geral|anuncios|perfil/i).first()).toBeVisible()
  })

  test('admin credentials reach the admin shell', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD

    test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin smoke.')

    await signIn(page, email ?? '', password ?? '')

    await expect(page).toHaveURL(/\/admin(\/|$)/)
    await expect(page.getByText(/painel admin/i)).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: /an[uú]ncios/i })).toBeVisible()
  })
})
