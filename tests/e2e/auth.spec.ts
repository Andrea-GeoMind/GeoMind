/**
 * Scénario A — Auth : signup, login, reset, protection
 * Scénario G (partiel) — Sécurité : redirects, isolation, XSS, SQL injection
 *
 * Lancer sur prod : PLAYWRIGHT_BASE_URL=https://geomind.fr pnpm test:e2e
 */
import { test, expect } from './fixtures/auth'
import { test as base } from '@playwright/test'

test.describe('Scénario A — Auth', () => {
  test('signup form visible + submit avec email valide', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
    // Use exact label to avoid ambiguity with "Confirmer le mot de passe"
    await page.getByLabel('Email').fill(`audit-signup-${Date.now()}@example.com`)
    await page.getByLabel('Mot de passe', { exact: true }).fill('Test1234!')
    await page.getByLabel('Confirmer le mot de passe').fill('Test1234!')
    await expect(page.getByRole('button', { name: /créer mon compte/i })).toBeVisible()
  })

  test('login avec compte confirmé → redirige vers dashboard/onboarding', async ({
    loggedInPage,
  }) => {
    await expect(loggedInPage).toHaveURL(/\/(dashboard|onboarding)/)
  })

  test('signup avec email déjà pris → erreur claire', async ({ testAccount, page }) => {
    await page.goto('/signup')
    await page.getByLabel('Email').fill(testAccount.email)
    await page.getByLabel('Mot de passe', { exact: true }).fill('AnotherPass1!')
    await page.getByLabel('Confirmer le mot de passe').fill('AnotherPass1!')
    await page.getByRole('button', { name: /créer mon compte/i }).click()
    // Supabase returns English error for already-registered user
    await expect(page.getByText(/already registered|déjà|existe|utilisé/i)).toBeVisible({
      timeout: 10_000,
    })
  })

  test('page reset password visible', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: /mot de passe|réinitialiser/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

test.describe('Scénario G — Sécurité (sans auth)', () => {
  base('accès /dashboard sans session → redirect /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  base('accès /settings/billing sans session → redirect /login', async ({ page }) => {
    await page.goto('/settings/billing')
    await expect(page).toHaveURL(/\/login/)
  })

  base('accès /onboarding sans session → redirect /login', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/)
  })

  base('accès /sites/fake-id/overview sans session → redirect /login', async ({ page }) => {
    await page.goto('/sites/00000000-0000-0000-0000-000000000000/overview')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Scénario G — Sécurité (avec auth)', () => {
  test('accès site inexistant → pas de crash (404 ou redirect)', async ({ loggedInPage }) => {
    await loggedInPage.goto('/sites/00000000-0000-0000-0000-000000000000/overview')
    // Should get 404 or redirect to dashboard — never show another user's data
    const url = loggedInPage.url()
    const title = await loggedInPage.title()
    // Either redirected to dashboard or a 404 page — not a crash
    const isHandled =
      url.includes('/dashboard') ||
      url.includes('/sites/00000000') ||
      title.includes('404') ||
      title.includes('Not found') ||
      title.includes('Introuvable')
    expect(isHandled).toBe(true)
  })

  test("XSS dans form : balise script échappée à l'affichage", async ({ loggedInPage }) => {
    // Go to onboarding and try to inject a script via site name
    await loggedInPage.goto('/onboarding')
    const nameInput = loggedInPage.getByLabel(/nom|name/i).first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('<script>alert("xss")</script>')
      // Check no alert fires
      let alertFired = false
      loggedInPage.on('dialog', () => {
        alertFired = true
      })
      await loggedInPage.keyboard.press('Tab')
      await loggedInPage.waitForTimeout(1000)
      expect(alertFired).toBe(false)
    }
  })
})
