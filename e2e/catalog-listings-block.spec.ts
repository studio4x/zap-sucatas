import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { buildQaTitle, fillListingEditor, signIn } from './support'

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

test.describe('BLK-CATALOGO-ANUNCIOS', () => {
  test('CAT-01..CAT-06 em producao', async ({ browser }) => {
    test.setTimeout(240000)

    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://zap-sucatas.vercel.app/'
    const userEmail = process.env.E2E_USER_EMAIL ?? 'qa-user@zapsucatas.local'
    const userPassword = process.env.E2E_USER_PASSWORD ?? 'ZapSucatas@2026!User'
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'qa-admin@zapsucatas.local'
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'ZapSucatas@2026!Admin'

    const adminClient = createClient(
      requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const listingApprovedTitle = buildQaTitle('CAT aprovado')
    const listingRejectedTitle = buildQaTitle('CAT rejeitado')
    const rejectionReason = `Motivo QA ${Date.now()} - completar dados comerciais`
    const editedTitle = `${listingApprovedTitle} editado`

    let publicPath = ''
    let approvedListingId = ''
    let rejectedListingId = ''

    const userContext = await browser.newContext({ baseURL })
    const adminContext = await browser.newContext({ baseURL })
    const publicContext = await browser.newContext({ baseURL })
    const userPage = await userContext.newPage()
    const adminPage = await adminContext.newPage()
    const publicPage = await publicContext.newPage()

    try {
      await test.step('CAT-01: criar anuncio e salvar como rascunho', async () => {
        await signIn(userPage, userEmail, userPassword)
        await expect(userPage).toHaveURL(/\/app(\/|$)/, { timeout: 30000 })
        await userPage.goto('/app/anuncios/novo')
        await fillListingEditor(userPage, listingApprovedTitle)
        await userPage.getByRole('button', { name: /salvar rascunho/i }).click()
        await expect(userPage).toHaveURL(/\/app\/anuncios(\/|$)/, { timeout: 30000 })

        const { data: createdDraft, error: createdDraftError } = await adminClient
          .from('listings')
          .select('id, status')
          .eq('title', listingApprovedTitle)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (createdDraftError || !createdDraft) {
          throw createdDraftError ?? new Error('Draft listing not found after creation.')
        }

        approvedListingId = createdDraft.id
        expect(createdDraft.status).toBe('draft')
      })

      await test.step('CAT-02: enviar para revisao e validar status', async () => {
        await userPage.goto(`/app/anuncios/${approvedListingId}/editar`)
        await userPage.locator('input[type="file"]').setInputFiles(path.resolve(process.cwd(), 'src/assets/hero.png'))
        await expect(userPage.getByRole('button', { name: /salvar e enviar para revis/i })).toBeEnabled({
          timeout: 30000,
        })
        await userPage.getByRole('button', { name: /salvar e enviar para revis/i }).click()
        await expect(userPage).toHaveURL(/\/app\/anuncios(\/|$)/, { timeout: 30000 })

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('listings')
                  .select('status')
                  .eq('id', approvedListingId)
                  .maybeSingle()
              ).data?.status ?? null,
            { timeout: 30000 },
          )
          .toBe('pending_review')
      })

      await test.step('CAT-03: aprovar no admin e validar exibicao publica', async () => {
        await signIn(adminPage, adminEmail, adminPassword)
        await expect(adminPage).toHaveURL(/\/admin(\/|$)/, { timeout: 30000 })
        await adminPage.goto(`/admin/anuncios/${approvedListingId}`)
        await adminPage.getByRole('button', { name: /aprovar an[uú]ncio/i }).click()
        await expect(adminPage).toHaveURL(/\/admin\/anuncios(\/|$)/, { timeout: 30000 })

        const approvedData = await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('listings')
                  .select('status, slug')
                  .eq('id', approvedListingId)
                  .maybeSingle()
              ).data,
            { timeout: 30000 },
          )
          .toMatchObject({ status: 'approved' })

        const approvedRow = (
          await adminClient.from('listings').select('status, slug').eq('id', approvedListingId).maybeSingle()
        ).data
        expect(approvedRow?.slug).toBeTruthy()
        publicPath = `/anuncios/${approvedRow?.slug}`

        await publicPage.goto(publicPath)
        await expect(publicPage).toHaveURL(/\/anuncios\/.+/)
        await expect(publicPage.getByRole('heading', { level: 1, name: listingApprovedTitle })).toBeVisible()
      })

      await test.step('CAT-04: reprovar anuncio e validar motivo para usuario', async () => {
        await userPage.goto('/app/anuncios/novo')
        await fillListingEditor(userPage, listingRejectedTitle)
        await userPage.getByRole('button', { name: /salvar rascunho/i }).click()
        await expect(userPage).toHaveURL(/\/app\/anuncios(\/|$)/, { timeout: 30000 })

        const { data: createdRejected, error: createdRejectedError } = await adminClient
          .from('listings')
          .select('id')
          .eq('title', listingRejectedTitle)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (createdRejectedError || !createdRejected) {
          throw createdRejectedError ?? new Error('Rejected-flow listing not found after creation.')
        }
        rejectedListingId = createdRejected.id
        await userPage.goto(`/app/anuncios/${rejectedListingId}/editar`)
        await userPage.locator('input[type="file"]').setInputFiles(path.resolve(process.cwd(), 'src/assets/hero.png'))
        await expect(userPage.getByRole('button', { name: /salvar e enviar para revis/i })).toBeEnabled({
          timeout: 30000,
        })
        await userPage.getByRole('button', { name: /salvar e enviar para revis/i }).click()
        await expect(userPage).toHaveURL(/\/app\/anuncios(\/|$)/, { timeout: 30000 })

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('listings')
                  .select('status')
                  .eq('id', rejectedListingId)
                  .maybeSingle()
              ).data?.status ?? null,
            { timeout: 30000 },
          )
          .toBe('pending_review')

        await adminPage.goto(`/admin/anuncios/${rejectedListingId}`)

        await adminPage.locator('#rejection-reason').fill(rejectionReason)
        await adminPage.getByRole('button', { name: /rejeitar an[uú]ncio/i }).click()
        await expect(adminPage).toHaveURL(/\/admin\/anuncios(\/|$)/, { timeout: 30000 })

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('listings')
                  .select('status, rejection_reason')
                  .eq('id', rejectedListingId)
                  .maybeSingle()
              ).data,
            { timeout: 30000 },
          )
          .toMatchObject({ status: 'rejected', rejection_reason: rejectionReason })

        await userPage.goto(`/app/anuncios/${rejectedListingId}/editar`)
        await expect(userPage.getByText(/Motivo da rejei[cç][aã]o anterior/i)).toBeVisible()
        await expect(userPage.getByText(rejectionReason)).toBeVisible()
      })

      await test.step('CAT-05: editar anuncio aprovado e validar consistencia', async () => {
        await userPage.goto(`/app/anuncios/${approvedListingId}/editar`)
        await userPage.getByLabel('Titulo').fill(editedTitle)
        await userPage.getByRole('button', { name: /salvar rascunho/i }).click()
        await expect(userPage).toHaveURL(/\/app\/anuncios(\/|$)/, { timeout: 30000 })

        await expect
          .poll(
            async () =>
              (
                await adminClient
                  .from('listings')
                  .select('title')
                  .eq('id', approvedListingId)
                  .maybeSingle()
              ).data?.title ?? null,
            { timeout: 30000 },
          )
          .toBe(editedTitle)

        await adminPage.goto(`/admin/anuncios/${approvedListingId}`)
        await expect(adminPage.getByRole('heading', { level: 1, name: editedTitle })).toBeVisible()
      })

      await test.step('CAT-06: validar filtros publicos por categoria/material/localidade', async () => {
        const { data: listing, error: listingError } = await adminClient
          .from('listings')
          .select('id, category_id, primary_material_id, city, state')
          .eq('id', approvedListingId)
          .maybeSingle()

        if (listingError || !listing) {
          throw listingError ?? new Error('Listing not found for CAT-06 filter checks.')
        }

        const [{ data: categoryRow, error: categoryError }, { data: materialRow, error: materialError }] =
          await Promise.all([
            adminClient.from('listing_categories').select('name').eq('id', listing.category_id).maybeSingle(),
            adminClient.from('listing_materials').select('name').eq('id', listing.primary_material_id).maybeSingle(),
          ])

        if (categoryError || materialError || !categoryRow || !materialRow) {
          throw categoryError ?? materialError ?? new Error('Category/material metadata not found for CAT-06.')
        }

        await publicPage.goto('/anuncios')
        await publicPage.getByRole('button', { name: categoryRow.name, exact: true }).click()
        await publicPage.getByRole('button', { name: listing.state, exact: true }).click()
        await publicPage.getByRole('button', { name: listing.city, exact: true }).first().click()
        await publicPage.getByPlaceholder(/Busque por material/i).fill(materialRow.name)

        await expect(publicPage.getByText(new RegExp(editedTitle, 'i')).first()).toBeVisible({ timeout: 30000 })
      })
    } finally {
      await Promise.allSettled([userContext.close(), adminContext.close(), publicContext.close()])
    }
  })
})
