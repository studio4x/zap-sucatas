import { expect, test } from '@playwright/test'
import { buildQaTitle, searchForText, signInAsAdmin } from './support'

test.describe('admin operational CRUDs', () => {
  test.describe.configure({ mode: 'serial' })

  test('categories support create, edit, toggle and delete', async ({ page }) => {
    const categoryName = buildQaTitle('QA categoria')
    const updatedName = `${categoryName} editada`

    await signInAsAdmin(page)
    await page.goto('/admin/categorias')

    await page.getByLabel('Nome').fill(categoryName)
    await page.getByLabel('Slug').fill(`qa-categoria-${Date.now()}`)
    await page.getByLabel('Descrição').fill('Categoria criada automaticamente para validacao E2E.')
    await page.getByRole('button', { name: /criar categoria/i }).click()
    await expect(page.getByText(/categoria criada com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome, slug ou descri/i, categoryName)
    let row = page.locator('tr', { hasText: categoryName }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /editar/i }).click()
    await page.getByLabel('Nome').fill(updatedName)
    await page.getByRole('button', { name: /atualizar categoria/i }).click()
    await expect(page.getByText(/categoria atualizada com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome, slug ou descri/i, updatedName)
    row = page.locator('tr', { hasText: updatedName }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /inativar/i }).click()
    await expect(page.getByText(/status da categoria atualizado com sucesso/i)).toBeVisible()
    await expect(row).toContainText(/inativa/i)

    await row.getByRole('button', { name: /reativar/i }).click()
    await expect(page.getByText(/status da categoria atualizado com sucesso/i)).toBeVisible()
    await expect(row).toContainText(/ativa/i)

    page.once('dialog', async (dialog) => {
      await dialog.accept()
    })
    await row.getByRole('button', { name: /excluir/i }).click()
    await expect(page.locator('tr', { hasText: updatedName })).toHaveCount(0)
  })

  test('materials support create, edit, toggle and delete', async ({ page }) => {
    const materialName = buildQaTitle('QA material')
    const updatedName = `${materialName} editado`

    await signInAsAdmin(page)
    await page.goto('/admin/materiais')

    await page.getByLabel('Nome').fill(materialName)
    await page.getByLabel('Slug').fill(`qa-material-${Date.now()}`)
    await page.getByRole('button', { name: /criar material/i }).click()
    await expect(page.getByText(/material criado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome ou slug/i, materialName)
    let row = page.locator('tr', { hasText: materialName }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /editar/i }).click()
    await page.getByLabel('Nome').fill(updatedName)
    await page.getByRole('button', { name: /atualizar material/i }).click()
    await expect(page.getByText(/material atualizado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por nome ou slug/i, updatedName)
    row = page.locator('tr', { hasText: updatedName }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /inativar/i }).click()
    await expect(row).toContainText(/inativo/i, { timeout: 30000 })

    await row.getByRole('button', { name: /reativar/i }).click()
    await expect(row).toContainText(/ativo/i, { timeout: 30000 })

    page.once('dialog', async (dialog) => {
      await dialog.accept()
    })
    await row.getByRole('button', { name: /excluir/i }).click()
    await expect(page.locator('tr', { hasText: updatedName })).toHaveCount(0)
  })

  test('manual pricing entries support create, edit and delete', async ({ page }) => {
    const materialName = buildQaTitle('QA preco')
    const updatedLabel = 'R$ 2,80/kg'

    await signInAsAdmin(page)
    await page.goto('/admin/precos')

    await page.locator('#manual-material').fill(materialName)
    await page.locator('#manual-region').fill('SP')
    await page.locator('#manual-label').fill('R$ 2,50/kg')
    await page.locator('#manual-price').fill('2,50')
    await page.locator('#manual-unit').fill('kg')
    await page.getByRole('button', { name: /criar entrada manual/i }).click()
    await expect(page.getByText(/entrada manual criada com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar entrada manual por material, regi/i, materialName)
    let row = page.locator('tr', { hasText: materialName }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /editar/i }).click()
    await page.locator('#manual-label').fill(updatedLabel)
    await page.locator('#manual-price').fill('2,80')
    await page.getByRole('button', { name: /atualizar entrada manual/i }).click()
    await expect(page.getByText(/entrada manual atualizada com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar entrada manual por material, regi/i, materialName)
    row = page.locator('tr', { hasText: materialName }).first()
    await expect(row).toContainText(updatedLabel)

    await row.getByRole('button', { name: /remover/i }).click()
    await page.getByRole('button', { name: /remover entrada/i }).click()
    await expect(page.getByText(/entrada manual removida com sucesso/i)).toBeVisible()
    await expect(page.locator('tr', { hasText: materialName })).toHaveCount(0)
  })

  test('blog draft supports create, edit and delete', async ({ page }) => {
    const title = buildQaTitle('QA post')
    const updatedTitle = `${title} revisado`

    await signInAsAdmin(page)
    await page.goto('/admin/blog')

    await page.locator('#blog-post-title').fill(title)
    await page.locator('#blog-post-slug').fill(`qa-post-${Date.now()}`)
    await page.locator('#blog-post-excerpt').fill('Post de rascunho criado automaticamente para validacao editorial.')
    await page.locator('#blog-post-tags').fill('qa, automacao, blog')
    await page.locator('#blog-post-content').fill('Primeiro paragrafo do post automatizado.\n\nSegundo paragrafo do fluxo E2E.')
    await page.getByRole('button', { name: /criar post/i }).click()
    await expect(page.getByText(/criado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por titulo, slug ou resumo/i, title)
    let row = page.locator('tr', { hasText: title }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /editar/i }).click()
    await page.locator('#blog-post-title').fill(updatedTitle)
    await page.getByRole('button', { name: /atualizar post/i }).click()
    await expect(page.getByText(/atualizado com sucesso/i)).toBeVisible()

    await searchForText(page, /buscar por titulo, slug ou resumo/i, updatedTitle)
    row = page.locator('tr', { hasText: updatedTitle }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: /excluir/i }).click()
    await page.getByRole('button', { name: /excluir post/i }).click()
    await expect(page.getByText(/post removido com sucesso/i)).toBeVisible()
    await expect(page.locator('tr', { hasText: updatedTitle })).toHaveCount(0)
  })
})
