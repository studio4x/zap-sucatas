import { expect, test } from '@playwright/test'
import { buildQaTitle, fillListingEditor, searchForText, signIn } from './support'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'

test('question lifecycle stays coherent across public, owner and admin', async ({ browser }) => {
  test.setTimeout(180_000)

  const userEmail = process.env.E2E_QUESTION_USER_EMAIL ?? 'qa-user-question@zapsucatas.local'
  const userPassword = process.env.E2E_QUESTION_USER_PASSWORD ?? 'ZapSucatas@2026!QuestionUser'
  const adminEmail = process.env.E2E_QUESTION_ADMIN_EMAIL ?? 'qa-admin-question@zapsucatas.local'
  const adminPassword = process.env.E2E_QUESTION_ADMIN_PASSWORD ?? 'ZapSucatas@2026!QuestionAdmin'
  const listingTitle = buildQaTitle('QA anuncio perguntas')
  const questionText = buildQaTitle('Pergunta QA automatizada')
  const answerText = `Resposta para ${questionText}`
  let publicPath = ''

  const userContext = await browser.newContext({ baseURL: BASE_URL })
  const adminContext = await browser.newContext({ baseURL: BASE_URL })
  const publicContext = await browser.newContext({ baseURL: BASE_URL })
  const userPage = await userContext.newPage()
  const adminPage = await adminContext.newPage()
  const publicPage = await publicContext.newPage()

  try {
    await test.step('user creates listing and admin approves it', async () => {
      await signIn(userPage, userEmail, userPassword)
      await expect(userPage).toHaveURL(/\/app(\/|$)/, { timeout: 30000 })
      await userPage.goto('/app/anuncios/novo')
      await fillListingEditor(userPage, listingTitle)
      await userPage.getByRole('button', { name: /salvar e enviar para revis/i }).click()
      await expect
        .poll(() => new URL(userPage.url()).pathname, { timeout: 30000 })
        .toBe('/app/anuncios')
      await searchForText(userPage, /buscar por t/i, listingTitle)
      const userRow = userPage.locator('tr', { hasText: listingTitle }).first()
      await expect(userRow).toBeVisible()
      await expect(userRow).toContainText(/revis/i)

      await signIn(adminPage, adminEmail, adminPassword)
      await expect(adminPage).toHaveURL(/\/admin(\/|$)/, { timeout: 30000 })
      await adminPage.goto('/admin/anuncios')
      await searchForText(adminPage, /buscar por t/i, listingTitle)

      const row = adminPage.locator('tr', { hasText: listingTitle }).first()
      await expect(row).toBeVisible()
      await expect(row).toContainText(/revis/i)
      const detailsPath = (await row.getByRole('link', { name: /detalhe/i }).getAttribute('href')) ?? ''
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
      publicPath =
        (await adminPage
          .locator('tr', { hasText: listingTitle })
          .first()
          .getByRole('link', { name: /p[úu]blico/i })
          .getAttribute('href')) ?? ''
      expect(publicPath).toBeTruthy()
    })

    await test.step('authenticated visitor submits a question on the public listing', async () => {
      await signIn(publicPage, adminEmail, adminPassword)
      await expect(publicPage).toHaveURL(/\/admin(\/|$)/, { timeout: 30000 })
      await publicPage.goto(publicPath)
      await publicPage.getByPlaceholder(/descreva sua duvida/i).fill(questionText)
      await publicPage.getByRole('button', { name: /enviar pergunta/i }).click()
      await expect(publicPage.getByText(/pergunta enviada com sucesso/i)).toBeVisible()
      await expect(publicPage.getByText(questionText)).toBeVisible()
    })

    await test.step('owner answers the question in the dashboard', async () => {
      await userPage.goto('/app/perguntas')
      await searchForText(userPage, /buscar por pergunta ou an/i, questionText)
      await expect(userPage.getByText(questionText)).toBeVisible()
      await userPage.getByLabel('Responder pergunta').fill(answerText)
      await userPage.getByRole('button', { name: /salvar resposta/i }).click()
      await expect(userPage.getByText(/resposta salva com sucesso/i)).toBeVisible()
    })

    await test.step('admin hides the question and public page stops showing it', async () => {
      await expect
        .poll(
          async () => {
            await adminPage.goto('/admin/perguntas')
            await searchForText(adminPage, /buscar por pergunta, an/i, questionText)
            return await adminPage.locator('tr', { hasText: questionText }).count()
          },
          { timeout: 30000 },
        )
        .toBeGreaterThan(0)

      const adminQuestionRow = adminPage.locator('tr', { hasText: questionText }).first()
      await expect(adminQuestionRow).toBeVisible()
      await adminQuestionRow.getByRole('button', { name: /abrir thread/i }).click()
      await adminPage.getByRole('button', { name: /^Ocultar$/i }).click()
      await expect(adminPage.getByText(/status da pergunta atualizado com sucesso/i)).toBeVisible()

      await publicPage.goto(publicPath)
      await expect(publicPage.getByText(questionText)).not.toBeVisible()
    })
  } finally {
    await Promise.allSettled([userContext.close(), adminContext.close(), publicContext.close()])
  }
})
