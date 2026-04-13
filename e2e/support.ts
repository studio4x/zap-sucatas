import path from 'node:path'
import { expect, type Page } from '@playwright/test'

export function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail').first().fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /^Entrar$/i }).click()
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: /sair/i }).first().click()
  await expect(page).toHaveURL(/\/(login)?$/)
}

const REAL_IMAGE_PATH = path.resolve(process.cwd(), 'src/assets/hero.png')

export async function fillListingEditor(page: Page, title: string) {
  await page.getByLabel('Titulo').fill(title)
  await selectFirstRealOption(page, '#listing-category')
  await selectFirstRealOption(page, '#listing-material')
  await page.getByLabel('Resumo comercial').fill(`${title} com leitura comercial para fluxo E2E.`)
  await page.getByLabel('Descricao').fill(
    `${title} criado automaticamente para validar criacao, moderacao e publicacao do marketplace.`,
  )
  await page.getByLabel('Cidade').fill('Sao Paulo')
  await page.getByLabel('Estado').fill('SP')
  await page.getByLabel('Nome de contato').fill('Zap Sucatas QA')
  await page.getByLabel('Telefone de contato').fill('(11) 99999-0000')
  await page.getByLabel('Condicao').fill('Lote para validacao automatizada')
  await page.getByLabel('Faixa de preço').fill('Sob consulta')

  await page.locator('input[type="file"]').setInputFiles(REAL_IMAGE_PATH)
  await expect(page.getByRole('button', { name: /salvar e enviar para revis/i })).toBeEnabled()
}

export async function searchForText(page: Page, placeholderPattern: RegExp, value: string) {
  const input = page.getByPlaceholder(placeholderPattern)
  await input.fill('')
  await input.fill(value)
}

export function buildQaTitle(prefix: string) {
  return `${prefix} ${Date.now()}`
}

async function selectFirstRealOption(page: Page, selector: string) {
  const value = await page.locator(`${selector} option:nth-child(2)`).getAttribute('value')

  if (!value) {
    throw new Error(`No selectable value found for ${selector}`)
  }

  await page.locator(selector).selectOption(value)
}
