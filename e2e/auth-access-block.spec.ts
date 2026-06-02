import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_E2E_USER_EMAIL,
  DEFAULT_E2E_USER_PASSWORD,
  buildQaEmail,
  signIn,
  signInAsUser,
  signOut,
} from './support'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

test.describe('BLK-AUTH-ACESSO', () => {
  test('AUTH-01: acessar /app sem login redireciona para /login', async ({ page }) => {
    await page.goto('/app')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /login da conta/i })).toBeVisible()
  })

  test('AUTH-02: acessar /admin com usuário não-admin bloqueia acesso', async ({ page }) => {
    await signInAsUser(page)
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/app(\/|$)/)
    await expect(page.getByRole('heading', { name: /vis[aã]o geral|painel/i })).toBeVisible()
  })

  test('AUTH-03: criar conta nova e confirmar sessão no dashboard', async ({ page }) => {
    const admin = createClient(
      requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL ?? supabaseUrl),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY ?? serviceRoleKey),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const password = 'ZapSucatas@2026!NewUser'
    const email = buildQaEmail('auth-access-signup')

    await page.goto('/cadastro')
    await page.getByLabel('Nome completo').fill('Usuário QA Auth')
    await page.getByLabel('E-mail').fill(email)
    await page.locator('#register-password').fill(password)
    await page.locator('#register-confirm-password').fill(password)
    await page.getByRole('button', { name: /^Criar conta$/i }).click()

    if (/\/cadastro$/.test(page.url())) {
      const confirmationModal = page.getByRole('heading', { name: /confirme seu e-mail/i })
      const rateLimitMessage = page.getByText(/rate limit/i)
      await page.waitForTimeout(1000)
      const registrationFailedByRateLimit = await rateLimitMessage.isVisible()

      if (!registrationFailedByRateLimit) {
        await expect(confirmationModal).toBeVisible()
      }

      if (registrationFailedByRateLimit) {
        const adminCreateResponse = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password,
          user_metadata: { full_name: 'Usuário QA Auth' },
        })

        if (adminCreateResponse.error) {
          throw adminCreateResponse.error
        }
      } else {
        const usersResponse = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
        if (usersResponse.error) {
          throw usersResponse.error
        }
        const createdUser = usersResponse.data.users.find((user) => user.email === email)
        if (!createdUser) {
          throw new Error(`User not found after signup: ${email}`)
        }
        const updateResponse = await admin.auth.admin.updateUserById(createdUser.id, { email_confirm: true })
        if (updateResponse.error) {
          throw updateResponse.error
        }
      }

      await signIn(page, email, password)
    }

    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30000 })
    await expect(page.getByRole('heading', { name: /vis[aã]o geral|painel/i })).toBeVisible()
  })

  test('AUTH-04: solicitar recuperação de senha e validar fluxo completo', async ({ page }) => {
    const admin = createClient(
      requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL ?? supabaseUrl),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY ?? serviceRoleKey),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const email = buildQaEmail('auth-access-recovery')
    const originalPassword = 'ZapSucatas@2026!OldPass'
    const newPassword = 'ZapSucatas@2026!NewPass'

    let createdUserId: string | null = null

    try {
      const createResponse = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: originalPassword,
        user_metadata: { full_name: 'Usuário QA Recovery' },
      })

      if (createResponse.error) {
        throw createResponse.error
      }
      createdUserId = createResponse.data.user?.id ?? null

      await page.goto('/recuperar-senha')
      await page.getByLabel('E-mail').fill(email)
      await page.getByRole('button', { name: /enviar link/i }).click()
      await page.waitForTimeout(1000)
      const successMessage = page.getByText(/e-?mail de recuperação enviado/i)
      const rateLimitMessage = page.getByText(/rate limit/i)
      if (!(await successMessage.isVisible()) && !(await rateLimitMessage.isVisible())) {
        throw new Error('Password reset request returned an unexpected response message.')
      }

      const linkResponse = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${new URL(page.url()).origin}/recuperar-senha`,
        },
      })

      if (linkResponse.error) {
        throw linkResponse.error
      }

      const actionLink = linkResponse.data.properties?.action_link

      if (!actionLink) {
        throw new Error('Recovery action link was not generated by Supabase admin API.')
      }

      await page.goto(actionLink)
      await expect(page).toHaveURL(/\/recuperar-senha/)

      await page.locator('#new-password').fill(newPassword)
      await page.locator('#confirm-new-password').fill(newPassword)
      await page.getByRole('button', { name: /atualizar senha/i }).click()
      await expect(page.getByText(/senha atualizada com sucesso/i)).toBeVisible()

      await page.context().clearCookies()
      await page.goto('/')
      await page.evaluate(() => {
        window.localStorage.clear()
        window.sessionStorage.clear()
      })
      await signIn(page, email, newPassword)
      await expect(page).toHaveURL(/\/app(\/|$)/)
    } finally {
      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId)
      }
    }
  })

  test('AUTH-05: logout encerra sessão e restringe rotas privadas', async ({ page }) => {
    await signIn(page, process.env.E2E_USER_EMAIL ?? DEFAULT_E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD ?? DEFAULT_E2E_USER_PASSWORD)
    await expect(page).toHaveURL(/\/(app|admin)(\/|$)/)

    await signOut(page)
    await page.goto('/app')
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })
})