import { expect, test } from '@playwright/test'
import { buildQaTitle, signInAsAdmin } from './support'

test.describe('BLK-CONTATO (4.10.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('CTT-01..03 envio público, entrada no admin e alteração de status', async ({ browser, page }) => {
    test.setTimeout(180_000)
    const email = `contato-${Date.now()}@zapsucatas.local`
    const token = buildQaTitle('QA contato token')
    const message = `Mensagem E2E do bloco contato. ${token}`
    const spoofedIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`

    await page.route('**/functions/v1/submit-contact-message', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-forwarded-for': spoofedIp,
      }
      await route.continue({ headers })
    })

    await page.goto('/contato')
    await page.getByPlaceholder(/digite seu nome/i).fill('QA Contato Bloco')
    await page.getByPlaceholder(/digite seu email/i).fill(email)
    await page.getByPlaceholder(/seu telefone/i).fill('(11) 98888-0000')
    await page.getByPlaceholder(/sua mensagem/i).fill(message)

    let submitted = false
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/functions/v1/submit-contact-message') &&
            response.request().method() === 'POST',
          { timeout: 20000 },
        )
        .catch(() => null)
      await page.getByRole('button', { name: /^enviar$/i }).click()
      const submitResponse = await responsePromise

      if (submitResponse?.ok()) {
        submitted = true
        break
      }

      const outcome = await Promise.race([
        page.getByText(/mensagem enviada com sucesso/i).waitFor({ timeout: 20000 }).then(() => 'success'),
        page.getByText(/muitas tentativas|aguarde|tente novamente/i).waitFor({ timeout: 20000 }).then(() => 'rate-limit'),
      ]).catch(() => 'timeout')

      if (outcome === 'success') {
        submitted = true
        break
      }

      await page.waitForTimeout(30000)
    }

    expect(submitted).toBeTruthy()

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    try {
      await signInAsAdmin(adminPage)
      await adminPage.goto('/admin/contato')
      await adminPage.getByPlaceholder(/buscar por nome, e-mail, telefone, assunto ou mensagem/i).fill(token)

      const row = adminPage.locator('tr', { hasText: token }).first()
      await expect(row).toBeVisible({ timeout: 30000 })
      await expect(row).toContainText(/nova/i)

      await row.getByRole('button', { name: /resolver/i }).click()
      await expect(adminPage.getByText(/status da mensagem atualizado com sucesso/i)).toBeVisible()
      await expect(adminPage.getByRole('heading', { name: /contato via site/i })).toBeVisible()
      await expect(adminPage.getByText(email).first()).toBeVisible()
      await adminPage.getByRole('button', { name: 'Fechar', exact: true }).click()
      await expect(row).toContainText(/resolvida/i)
    } finally {
      await adminContext.close()
    }
  })
})
