import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { signInAsAdmin } from './support'

function readLocalEnv(name: string) {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const text = fs.readFileSync(envPath, 'utf-8')
  const line = text
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${name}=`))

  if (!line) {
    throw new Error(`Missing ${name} in .env.local`)
  }

  return line.slice(name.length + 1).trim()
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? readLocalEnv('VITE_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? readLocalEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SITE_ASSETS_BUCKET = 'site-assets'
const VISUAL_MANIFEST_PATH = 'site/branding/manifest.json'

test.describe('BLK-SETTINGS-VISUAL (4.9.2)', () => {
  test.describe.configure({ mode: 'serial' })

  test('SET-01..05 upload de assets, site/seo e fallback visual', async ({ page }) => {
    test.setTimeout(300_000)

    const logoDarkFile = path.resolve(process.cwd(), 'src/assets/react.svg')
    const logoLightFile = path.resolve(process.cwd(), 'src/assets/vite.svg')
    const faviconFile = path.resolve(process.cwd(), 'public/favicon.svg')
    const uniqueToken = `qa-${Date.now()}`
    const siteName = `Zap Sucatas ${uniqueToken}`
    const seoTitle = `SEO ${uniqueToken}`
    const seoDescription = `Descrição SEO ${uniqueToken}`

    const { data: settingsBefore } = await supabaseAdmin
      .from('system_settings')
      .select('id, site_name, seo_title_default, seo_description_default')
      .limit(1)
      .single()

    const manifestBeforeResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${SITE_ASSETS_BUCKET}/${VISUAL_MANIFEST_PATH}`,
      { cache: 'no-store' },
    )
    const manifestBeforeText = manifestBeforeResponse.ok ? await manifestBeforeResponse.text() : null

    try {
      await signInAsAdmin(page)
      await page.goto('/admin/configuracoes')
      await page.getByRole('button', { name: /definições visuais|definicoes visuais/i }).click()

      const darkCard = page.locator('article', { hasText: /logotipo dark/i }).first()
      await darkCard.locator('input[type="file"]').setInputFiles(logoDarkFile)
      await expect(page.getByText(/asset visual publicado com sucesso/i)).toBeVisible({ timeout: 30000 })

      const lightCard = page.locator('article', { hasText: /logotipo light/i }).first()
      await lightCard.locator('input[type="file"]').setInputFiles(logoLightFile)
      await expect(page.getByText(/asset visual publicado com sucesso/i)).toBeVisible({ timeout: 30000 })

      const faviconCard = page.locator('article', { hasText: /favicon/i }).first()
      await faviconCard.locator('input[type="file"]').setInputFiles(faviconFile)
      await expect(page.getByText(/asset visual publicado com sucesso/i)).toBeVisible({ timeout: 30000 })

      await page.goto('/')
      await page.waitForTimeout(3000)
      const headerLogoSrc = await page.locator('header img[alt="Zap Sucatas"]').first().getAttribute('src')
      expect(headerLogoSrc?.includes('logo-dark')).toBeTruthy()
      const footerLogoSrc = await page.locator('footer img[alt="Zap Sucatas"]').first().getAttribute('src')
      expect(footerLogoSrc?.includes('logo-light')).toBeTruthy()
      const faviconHref = await page.evaluate(() => {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
        return link?.href ?? null
      })
      expect((faviconHref ?? '').includes('favicon')).toBeTruthy()

      await page.goto('/admin/configuracoes')
      await page.getByRole('button', { name: /^operação|operacao/i }).click()
      await page.locator('#site-name').fill(siteName)
      await page.locator('#seo-title').fill(seoTitle)
      await page.locator('#seo-description').fill(seoDescription)
      await page.getByRole('button', { name: /salvar configurações|salvar configuracoes/i }).click()
      await expect(page.getByText(/configurações globais atualizadas com sucesso|configuracoes globais atualizadas com sucesso/i)).toBeVisible({ timeout: 30000 })

      const { data: settingsAfter } = await supabaseAdmin
        .from('system_settings')
        .select('site_name, seo_title_default, seo_description_default')
        .eq('id', settingsBefore.id)
        .single()
      expect(settingsAfter?.site_name).toBe(siteName)
      expect(settingsAfter?.seo_title_default).toBe(seoTitle)
      expect(settingsAfter?.seo_description_default).toBe(seoDescription)

      const brokenManifest = {
        faviconPath: `site/branding/favicon/missing-${uniqueToken}.svg`,
        logoDarkPath: `site/branding/logo-dark/missing-${uniqueToken}.svg`,
        logoLightPath: `site/branding/logo-light/missing-${uniqueToken}.svg`,
        updatedAt: new Date().toISOString(),
      }
      const { error: brokenManifestError } = await supabaseAdmin.storage
        .from(SITE_ASSETS_BUCKET)
        .upload(
          VISUAL_MANIFEST_PATH,
          new Blob([JSON.stringify(brokenManifest)], { type: 'application/json' }),
          { upsert: true, contentType: 'application/json', cacheControl: '300' },
        )
      expect(brokenManifestError).toBeNull()

      await page.goto('/')
      await page.waitForTimeout(3000)
      await expect(page.locator('header').getByText('Zap Sucatas').first()).toBeVisible()
      await expect(page.locator('footer').getByText('Zap Sucatas').first()).toBeVisible()
    } finally {
      if (settingsBefore) {
        await supabaseAdmin
          .from('system_settings')
          .update({
            site_name: settingsBefore.site_name,
            seo_description_default: settingsBefore.seo_description_default,
            seo_title_default: settingsBefore.seo_title_default,
          })
          .eq('id', settingsBefore.id)
      }

      if (manifestBeforeText) {
        await supabaseAdmin.storage
          .from(SITE_ASSETS_BUCKET)
          .upload(
            VISUAL_MANIFEST_PATH,
            new Blob([manifestBeforeText], { type: 'application/json' }),
            { upsert: true, contentType: 'application/json', cacheControl: '300' },
          )
      }
    }
  })
})
