/**
 * Playwright fixture : crée un compte test confirmé via l'API admin Supabase
 * et expose des helpers auth.
 */
import { test as base, type Page } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export interface TestAccount {
  email: string
  password: string
  userId: string
}

/** Creates a confirmed Supabase user via admin REST API. */
async function createTestAccount(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create test account ${email}: ${res.status} ${body}`)
  }
  const data = (await res.json()) as { id: string }
  return data.id
}

/** Deletes a Supabase user via admin REST API. */
export async function deleteTestAccount(userId: string): Promise<void> {
  if (!userId) return
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok && res.status !== 404) {
    console.warn(`[test] Failed to delete user ${userId}: ${res.status}`)
  }
}

/** Logs in through the UI and returns the page ready for use. */
async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe|password/i).fill(password)
  await page.getByRole('button', { name: /se connecter|connexion/i }).click()
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })
}

type TestFixtures = {
  testAccount: TestAccount
  loggedInPage: Page
}

export const test = base.extend<TestFixtures>({
  testAccount: async ({}, use, testInfo) => {
    const ts = Date.now()
    const email = `audit-${testInfo.workerIndex}-${ts}@example.com`
    const password = 'Test1234!'
    const userId = await createTestAccount(email, password)
    await use({ email, password, userId })
    await deleteTestAccount(userId)
  },

  loggedInPage: async ({ page, testAccount }, use) => {
    await loginViaUI(page, testAccount.email, testAccount.password)
    await use(page)
  },
})

export { expect } from '@playwright/test'
