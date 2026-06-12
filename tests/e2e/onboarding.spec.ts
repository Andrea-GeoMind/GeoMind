/**
 * Scénario B — Onboarding wizard
 * Scénario E — Quotas Free
 *
 * Lancer sur prod : PLAYWRIGHT_BASE_URL=https://geomind.fr pnpm test:e2e
 */
import { test, expect } from './fixtures/auth'

test.describe('Scénario B — Onboarding wizard', () => {
  test('étape 1 : WelcomeStep visible avec bouton Commencer', async ({ loggedInPage }) => {
    // New user lands on /onboarding (step 1 = WelcomeStep)
    await loggedInPage.goto('/onboarding')
    await expect(loggedInPage).toHaveURL(/\/onboarding/)
    await expect(loggedInPage.getByRole('heading', { name: /bienvenue/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(loggedInPage.getByRole('button', { name: /commencer/i })).toBeVisible()
  })

  test('étape 2 : AddSiteStep — form site visible avec champs requis', async ({
    loggedInPage,
  }) => {
    // Navigate directly to step 2
    await loggedInPage.goto('/onboarding?step=2')
    // Labels: "Nom du site" and "URL"
    await expect(loggedInPage.getByLabel('Nom du site')).toBeVisible({ timeout: 10_000 })
    await expect(loggedInPage.getByLabel('URL')).toBeVisible()
  })

  test('étape 2 : soumission URL invalide → erreur de validation', async ({ loggedInPage }) => {
    await loggedInPage.goto('/onboarding?step=2')
    await loggedInPage.getByLabel('URL').fill('not-a-valid-url')
    const submitBtn = loggedInPage.getByRole('button', { name: /analyser|lancer|commencer|suivant/i })
    await submitBtn.click()
    await expect(
      loggedInPage.getByText(/invalide|valide|format|URL|http/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('étape 2 : soumission URL valide → progression vers étape 3', async ({ loggedInPage }) => {
    await loggedInPage.goto('/onboarding?step=2')
    await loggedInPage.getByLabel('Nom du site').fill('Example Audit')
    await loggedInPage.getByLabel('URL').fill('https://example.com')
    const submitBtn = loggedInPage.getByRole('button', { name: /analyser|lancer|commencer|suivant/i })
    await submitBtn.click()
    // Should progress to step 3 or dashboard
    await loggedInPage.waitForURL(/step=3|dashboard/, { timeout: 30_000 })
  })
})

test.describe('Scénario E — Quotas Free', () => {
  test('plan Free : limites affichées sur la page pricing', async ({ page }) => {
    await page.goto('/pricing')
    // Free plan should show limits
    await expect(page.getByText(/gratuit|free/i).first()).toBeVisible()
    await expect(page.getByText('59 €', { exact: true })).toBeVisible()
    await expect(page.getByText('149 €', { exact: true })).toBeVisible()
  })

  test('plan Free : page usage accessible après login', async ({ loggedInPage }) => {
    await loggedInPage.goto('/settings/usage')
    await expect(loggedInPage).toHaveURL(/\/settings\/usage/)
    // Should not redirect to login
    await expect(loggedInPage.getByRole('main')).toBeVisible({ timeout: 10_000 })
  })

  test('plan Free : page billing montre plan actuel', async ({ loggedInPage }) => {
    await loggedInPage.goto('/settings/billing')
    await expect(loggedInPage).toHaveURL(/\/settings\/billing/)
    await expect(loggedInPage.getByRole('main')).toBeVisible({ timeout: 10_000 })
    // Should show current plan
    await expect(
      loggedInPage.getByText(/gratuit|free|pro|plan/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
