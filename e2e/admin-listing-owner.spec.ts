import { expect, test } from '@playwright/test'
import { buildQaEmail, buildQaTitle, fillListingEditor, searchForText, signInAsAdmin } from './support'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'

test('admin can create and publish a listing for another owner', async ({ browser }) => {
  test.setTimeout(180_000)
  test.skip(
    process.env.E2E_RUN_ADMIN_LISTING_OWNER !== '1',
    'Set E2E_RUN_ADMIN_LISTING_OWNER=1 to run this regression test against the published environment.',
  )

  const listingTitle = buildQaTitle('QA anúncio admin para outro dono')
  const ownerEmail = process.env.E2E_OWNER_EMAIL ?? buildQaEmail('qa-owner-admin')
  const ownerFullName = `QA Proprietário Admin ${Date.now()}`
  const ownerPassword = 'ZapSucatas@2026!Owner'

  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()

  try {
    await signInAsAdmin(page)
    await expect(page).toHaveURL(/\/admin(\/|$)/, { timeout: 30_000 })
    await page.goto('/admin/anuncios/novo')

    await page.getByRole('button', { name: /novo usuário/i }).click()
    await page.getByLabel('Nome completo').fill(ownerFullName)
    await page.getByLabel('E-mail').fill(ownerEmail)
    await page.locator('#create-phone').fill('(11) 99999-0001')
    await page.getByLabel('Papel').selectOption('user')
    await page.getByLabel('Status').selectOption('active')
    await page.locator('#create-password').fill(ownerPassword)
    await page.locator('#create-confirm-password').fill(ownerPassword)
    await page.getByRole('button', { name: /criar e vincular/i }).click()

    let ownerLabel = ''
    await expect
      .poll(
        async () => {
          const labels = await page.locator('#admin-listing-owner option').allTextContents()
          ownerLabel = labels.find((label) => label.toLowerCase().includes(ownerEmail.toLowerCase())) ?? ''
          return ownerLabel
        },
        { timeout: 30_000 },
      )
      .not.toBe('')

    expect(ownerLabel).toBeTruthy()
    await page.locator('#admin-listing-owner').selectOption({ label: ownerLabel })
    const ownerValue = await page.locator('#admin-listing-owner option', { hasText: ownerLabel }).first().getAttribute('value')
    await expect(page.locator('#admin-listing-owner')).toHaveValue(ownerValue ?? '')

    await fillListingEditor(page, listingTitle, /salvar e publicar agora/i)
    await page.getByRole('button', { name: /salvar e publicar agora/i }).click()

    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe('/admin/anuncios')

    await searchForText(page, /buscar por t/i, listingTitle)
    const row = page.locator('tr', { hasText: listingTitle }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText(/aprovad|publicad/i)
  } finally {
    await context.close()
  }
})
