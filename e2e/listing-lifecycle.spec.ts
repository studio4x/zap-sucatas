import { expect, test } from '@playwright/test'
import { buildQaTitle, fillListingEditor, searchForText, signIn } from './support'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'

test('listing lifecycle stays coherent across user, admin and public', async ({ browser }) => {
  test.setTimeout(180_000)
  test.skip(
    process.env.E2E_RUN_LISTING_LIFECYCLE !== '1',
    'Set E2E_RUN_LISTING_LIFECYCLE=1 to run the end-to-end listing lifecycle against the published environment.',
  )

  const userEmail = process.env.E2E_FLOW_USER_EMAIL ?? 'qa-user-flow@zapsucatas.local'
  const userPassword = process.env.E2E_FLOW_USER_PASSWORD ?? 'ZapSucatas@2026!FlowUser'
  const adminEmail = process.env.E2E_FLOW_ADMIN_EMAIL ?? 'qa-admin-flow@zapsucatas.local'
  const adminPassword = process.env.E2E_FLOW_ADMIN_PASSWORD ?? 'ZapSucatas@2026!FlowAdmin'
  const listingTitle = buildQaTitle('QA anuncio ciclo completo')
  let publicPath = ''

  const userContext = await browser.newContext({ baseURL: BASE_URL })
  const adminContext = await browser.newContext({ baseURL: BASE_URL })
  const publicContext = await browser.newContext({ baseURL: BASE_URL })
  const userPage = await userContext.newPage()
  const adminPage = await adminContext.newPage()
  const publicPage = await publicContext.newPage()

  try {
    await test.step('user creates listing and submits it for review', async () => {
      await signIn(userPage, userEmail, userPassword)
      await expect(userPage).toHaveURL(/\/app(\/|$)/, { timeout: 30000 })
      await userPage.goto('/app/anuncios/novo')
      await fillListingEditor(userPage, listingTitle)
      await userPage.getByRole('button', { name: /salvar rascunho/i }).click()

      await expect
        .poll(
          () => {
            const path = new URL(userPage.url()).pathname
            return path === '/app/anuncios' || path === '/app/anuncios/novo' ? path : 'unexpected'
          },
          { timeout: 30000 },
        )
        .not.toBe('unexpected')

      if (new URL(userPage.url()).pathname !== '/app/anuncios') {
        await userPage.goto('/app/anuncios')
      }

      await searchForText(userPage, /buscar por t/i, listingTitle)

      const userRow = userPage.locator('tr', { hasText: listingTitle }).first()
      await expect(userRow).toBeVisible()
      await expect(userRow).toContainText(/rascunho/i)
      await userRow.getByRole('button', { name: /revis/i }).click()
      await expect(userRow).toContainText(/em revis/i, { timeout: 30000 })
    })

    await test.step('admin approves the listing and captures the public url', async () => {
      await signIn(adminPage, adminEmail, adminPassword)
      await expect(adminPage).toHaveURL(/\/admin(\/|$)/, { timeout: 30000 })
      await adminPage.goto('/admin/anuncios')
      await searchForText(adminPage, /buscar por t/i, listingTitle)

      const adminRow = adminPage.locator('tr', { hasText: listingTitle }).first()
      await expect(adminRow).toBeVisible()
      await expect(adminRow).toContainText(/em revis/i)
      const detailsPath =
        (await adminRow.getByRole('link', { name: /detalhe/i }).getAttribute('href')) ?? ''
      expect(detailsPath).toBeTruthy()
      await adminPage.goto(detailsPath)

      await expect
        .poll(() => new URL(adminPage.url()).pathname, { timeout: 30000 })
        .toMatch(/^\/admin\/anuncios\/.+/)
      await adminPage.getByRole('button', { name: /aprovar an/i }).click()
      await expect
        .poll(() => new URL(adminPage.url()).pathname, { timeout: 30000 })
        .toBe('/admin/anuncios')

      await searchForText(adminPage, /buscar por t/i, listingTitle)
      const approvedRow = adminPage.locator('tr', { hasText: listingTitle }).first()
      await expect(approvedRow).toBeVisible()
      await expect(approvedRow).toContainText(/aprovado/i)

      const href = await approvedRow
        .getByRole('link', { name: /p[úu]blico/i })
        .getAttribute('href')
      expect(href).toBeTruthy()
      publicPath = href ?? ''
    })

    await test.step('public page exposes the approved listing', async () => {
      await publicPage.goto(publicPath)
      await expect(publicPage).toHaveURL(/\/anuncios\/.+/)
      await expect(publicPage.getByRole('heading', { level: 1, name: listingTitle })).toBeVisible()
    })

    await test.step('admin pauses and archives the listing', async () => {
      await adminPage.goto('/admin/anuncios')
      await searchForText(adminPage, /buscar por t/i, listingTitle)
      const pauseRow = adminPage.locator('tr', { hasText: listingTitle }).first()
      const pauseDetailsPath =
        (await pauseRow.getByRole('link', { name: /detalhe/i }).getAttribute('href')) ?? ''
      expect(pauseDetailsPath).toBeTruthy()
      await adminPage.goto(pauseDetailsPath)

      await adminPage.getByRole('button', { name: /pausar an/i }).click()
      await expect(adminPage.getByText(/an[úu]ncio pausado com sucesso/i)).toBeVisible()
      await expect(adminPage.getByText(/^Pausado$/)).toBeVisible()

      await publicPage.goto(publicPath)
      await expect(publicPage.getByText(/nao foi possivel carregar o anuncio solicitado/i)).toBeVisible()

      await adminPage.goto('/admin/anuncios')
      await searchForText(adminPage, /buscar por t/i, listingTitle)
      const archiveRow = adminPage.locator('tr', { hasText: listingTitle }).first()
      const archiveDetailsPath =
        (await archiveRow.getByRole('link', { name: /detalhe/i }).getAttribute('href')) ?? ''
      expect(archiveDetailsPath).toBeTruthy()
      await adminPage.goto(archiveDetailsPath)

      adminPage.once('dialog', async (dialog) => {
        await dialog.accept()
      })
      await adminPage.getByRole('button', { name: /arquivar an/i }).click()
      await expect
        .poll(() => new URL(adminPage.url()).pathname, { timeout: 30000 })
        .toBe('/admin/anuncios')

      await searchForText(adminPage, /buscar por t/i, listingTitle)
      const archivedRow = adminPage.locator('tr', { hasText: listingTitle }).first()
      await expect(archivedRow).toBeVisible()
      await expect(archivedRow).toContainText(/arquivad/i)
    })

    await test.step('owner dashboard reflects the archived status', async () => {
      await userPage.goto('/app/anuncios')
      await searchForText(userPage, /buscar por t/i, listingTitle)

      const userRow = userPage.locator('tr', { hasText: listingTitle }).first()
      await expect(userRow).toBeVisible()
      await expect(userRow).toContainText(/arquivad/i)
    })
  } finally {
    await Promise.allSettled([userContext.close(), adminContext.close(), publicContext.close()])
  }
})
