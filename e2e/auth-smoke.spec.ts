import { expect, test } from '@playwright/test'
import {
  DEFAULT_E2E_ADMIN_EMAIL,
  DEFAULT_E2E_ADMIN_PASSWORD,
  DEFAULT_E2E_USER_EMAIL,
  DEFAULT_E2E_USER_PASSWORD,
  signIn,
} from './support'

test.describe('authenticated smoke', () => {
  test('user credentials reach the dashboard shell', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL ?? DEFAULT_E2E_USER_EMAIL
    const password = process.env.E2E_USER_PASSWORD ?? DEFAULT_E2E_USER_PASSWORD

    await signIn(page, email, password)

    await expect(page).toHaveURL(/\/app(\/|$)/)
    await expect(page.getByText(/visao geral|anuncios|perfil/i).first()).toBeVisible()
  })

  test('admin credentials reach the admin shell', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL ?? DEFAULT_E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD ?? DEFAULT_E2E_ADMIN_PASSWORD

    await signIn(page, email, password)

    await expect(page).toHaveURL(/\/admin(\/|$)/)
    await expect(page.getByText(/painel admin/i)).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: /an[uú]ncios/i })).toBeVisible()
  })
})
