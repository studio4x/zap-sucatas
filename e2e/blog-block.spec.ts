import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { buildQaTitle, signIn } from './support'

if (typeof process.loadEnvFile === 'function') {
  const localEnvPath = path.resolve(process.cwd(), '.env.local')
  if (existsSync(localEnvPath)) {
    process.loadEnvFile(localEnvPath)
  }
}

function requireEnv(name: 'VITE_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY', value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

test.describe('BLK-BLOG', () => {
  test('BLOG-01..BLOG-04 em produção', async ({ browser }) => {
    test.setTimeout(240000)

    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://zap-sucatas.vercel.app/'
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'qa-admin@zapsucatas.local'
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'ZapSucatas@2026!Admin'

    const postTitle = buildQaTitle('BLOG QA post')
    const postSlug = `blog-qa-${Date.now()}`
    const excerpt = `Resumo do ${postTitle} para validar fluxo editorial em produção.`
    const content = `<p>${postTitle} com conteúdo técnico para validação de publicação, SEO e arquivamento no portal.</p><p>Texto complementar com mais de quarenta caracteres para cumprir regra de conteúdo.</p>`
    const seoTitle = `${postTitle} SEO`
    const seoDescription = `Descrição SEO do ${postTitle} validada no metatag description.`

    const adminClient = createClient(
      requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    let postId = ''

    const adminContext = await browser.newContext({ baseURL })
    const publicContext = await browser.newContext({ baseURL })
    const adminPage = await adminContext.newPage()
    const publicPage = await publicContext.newPage()

    try {
      await signIn(adminPage, adminEmail, adminPassword)
      await expect(adminPage).toHaveURL(/\/admin(\/|$)/, { timeout: 30000 })

      await test.step('BLOG-01: criar post em rascunho no admin', async () => {
        await adminPage.goto('/admin/blog')
        await adminPage.getByRole('button', { name: /novo post/i }).click()

        await adminPage.locator('#blog-post-title').fill(postTitle)
        await adminPage.locator('#blog-post-slug').fill(postSlug)
        await adminPage.locator('#blog-post-excerpt').fill(excerpt)
        await adminPage.locator('#blog-post-tags').fill('qa, blog, e2e')
        await adminPage.locator('#blog-post-status').selectOption('draft')

        await adminPage.getByRole('button', { name: /^HTML$/i }).click()
        await adminPage.locator('#blog-post-content-html').fill(content)

        await adminPage.getByRole('button', { name: /criar post/i }).click()
        await expect(adminPage.getByText(/criado com sucesso/i)).toBeVisible({ timeout: 30000 })

        await adminPage.locator('input[placeholder="Buscar por título, slug ou resumo"]').fill(postTitle)
        const row = adminPage.locator('tr', { hasText: postTitle }).first()
        await expect(row).toBeVisible()
        await expect(row).toContainText(/rascunho/i)

        const { data: draftData, error: draftError } = await adminClient
          .from('blog_posts')
          .select('id, status')
          .eq('slug', postSlug)
          .maybeSingle()
        if (draftError || !draftData) {
          throw draftError ?? new Error('Draft blog post not found by slug.')
        }
        postId = draftData.id
        expect(draftData.status).toBe('draft')
      })

      await test.step('BLOG-02: publicar post e validar rota pública por slug', async () => {
        const row = adminPage.locator('tr', { hasText: postTitle }).first()
        await row.getByRole('button', { name: /editar/i }).click()

        await adminPage.locator('#blog-post-status').selectOption('published')
        await adminPage.getByRole('button', { name: /atualizar post/i }).click()
        await expect(adminPage.getByText(/atualizado com sucesso/i)).toBeVisible({ timeout: 30000 })

        await adminPage.locator('input[placeholder="Buscar por título, slug ou resumo"]').fill(postTitle)
        const publishedRow = adminPage.locator('tr', { hasText: postTitle }).first()
        await expect(publishedRow).toContainText(/publicado/i)

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('blog_posts')
                  .select('status')
                  .eq('id', postId)
                  .maybeSingle()
              ).data?.status ?? null,
            { timeout: 30000 },
          )
          .toBe('published')

        await publicPage.goto(`/blog/${postSlug}`)
        await expect(publicPage).toHaveURL(new RegExp(`/blog/${postSlug}$`))
        await expect(publicPage.getByRole('heading', { level: 1, name: new RegExp(postTitle) })).toBeVisible()
      })

      await test.step('BLOG-03: editar SEO e validar metadados na página', async () => {
        await adminPage.locator('input[placeholder="Buscar por título, slug ou resumo"]').fill(postTitle)
        const row = adminPage.locator('tr', { hasText: postTitle }).first()
        await row.getByRole('button', { name: /editar/i }).click()

        await adminPage.locator('#blog-post-seo-title').fill(seoTitle)
        await adminPage.locator('#blog-post-seo-description').fill(seoDescription)
        await adminPage.getByRole('button', { name: /atualizar post/i }).click()
        await expect(adminPage.getByText(/atualizado com sucesso/i)).toBeVisible({ timeout: 30000 })

        await publicPage.goto(`/blog/${postSlug}`)
        await expect.poll(async () => publicPage.title(), { timeout: 30000 }).toBe(seoTitle)
        await expect
          .poll(
            async () =>
              await publicPage.evaluate(() =>
                document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
              ),
            { timeout: 30000 },
          )
          .toBe(seoDescription)
      })

      await test.step('BLOG-04: arquivar post e validar que sai da listagem pública', async () => {
        await adminPage.locator('input[placeholder="Buscar por título, slug ou resumo"]').fill(postTitle)
        const row = adminPage.locator('tr', { hasText: postTitle }).first()
        await row.getByRole('button', { name: /editar/i }).click()

        await adminPage.locator('#blog-post-status').selectOption('archived')
        await adminPage.getByRole('button', { name: /atualizar post/i }).click()
        await expect(adminPage.getByText(/atualizado com sucesso/i)).toBeVisible({ timeout: 30000 })

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('blog_posts')
                  .select('status')
                  .eq('id', postId)
                  .maybeSingle()
              ).data?.status ?? null,
            { timeout: 30000 },
          )
          .toBe('archived')

        await publicPage.goto('/blog')
        await expect(publicPage.getByText(postTitle)).toHaveCount(0)

        await publicPage.goto(`/blog/${postSlug}`)
        await expect(publicPage.getByText(/nao foi possível carregar o artigo solicitado/i)).toBeVisible()
      })
    } finally {
      await Promise.allSettled([adminContext.close(), publicContext.close()])
    }
  })
})