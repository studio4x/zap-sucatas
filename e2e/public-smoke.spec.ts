import { expect, test } from '@playwright/test'

test.describe('public marketplace smoke', () => {
  test('home search navigates to public listings', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Busque lotes, sucatas e equipamentos em um portal comercial feito para o setor\./i,
      }),
    ).toBeVisible()

    await page.getByPlaceholder(/Busque por material, sucata, maquina, lote ou cidade/i).fill('cobre')
    await page.getByRole('button', { name: /^Explorar anuncios$/i }).first().click()

    await expect(page).toHaveURL(/\/anuncios(\?|$)/)
    await expect(
      page.getByRole('heading', {
        name: /Anuncios de sucatas, metais e equipamentos com estrutura de marketplace/i,
      }),
    ).toBeVisible()
  })

  test('listing card opens the listing details page', async ({ page }) => {
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')

    const listingLinks = page.locator('a[href^="/anuncios/"]')
    const listingCount = await listingLinks.count()
    test.skip(listingCount === 0, 'No public listings available for smoke coverage.')

    await listingLinks.first().click()

    await expect(page).toHaveURL(/\/anuncios\/.+/)
    await expect(page.getByText(/Enviar uma pergunta/i)).toBeVisible()
  })

  test('categories page opens a category landing page', async ({ page }) => {
    await page.goto('/categorias')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', {
        name: /Explore o mercado por segmento/i,
      }),
    ).toBeVisible()

    const categoryLinks = page.locator('a[href^="/categorias/"]:not([href="/categorias"])')
    const categoryCount = await categoryLinks.count()
    test.skip(categoryCount === 0, 'No public categories available for smoke coverage.')

    await categoryLinks.first().click()

    await expect(page).toHaveURL(/\/categorias\/.+/)
    await expect(page.getByRole('link', { name: /Ver todas as categorias/i })).toBeVisible()
  })

  test('blog card opens the blog post page', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', {
        name: /Conteudo setorial da Zap Sucatas/i,
      }),
    ).toBeVisible()

    const blogLinks = page.locator('a[href^="/blog/"]:not([href="/blog"])')
    const postCount = await blogLinks.count()
    test.skip(postCount === 0, 'No blog posts available for smoke coverage.')

    await blogLinks.first().click()

    await expect(page).toHaveURL(/\/blog\/.+/)
    await expect(page.getByRole('link', { name: /Voltar ao blog/i })).toBeVisible()
  })

  test('contact page renders support channels and form', async ({ page }) => {
    await page.goto('/contato')

    await expect(
      page.getByRole('heading', {
        name: /Canal direto com a operacao/i,
      }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /Enviar mensagem/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar mensagem/i })).toBeVisible()
  })
})
