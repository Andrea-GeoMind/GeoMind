/**
 * Scénario H — Suppression RGPD (cascade delete)
 *
 * Lancer sur prod : PLAYWRIGHT_BASE_URL=https://geomind.fr pnpm test:e2e
 */
import { test, expect, deleteTestAccount } from './fixtures/auth'
import { test as base } from '@playwright/test'

test.describe('Scénario H — RGPD cascade', () => {
  test('suppression de compte : settings/account accessible', async ({ loggedInPage }) => {
    await loggedInPage.goto('/settings/account')
    await expect(loggedInPage).toHaveURL(/\/settings\/account/)
    await expect(loggedInPage.getByRole('main')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Pages légales — RGPD', () => {
  base.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://geomind.fr' })

  for (const path of ['/legal/cgv', '/legal/privacy', '/legal/mentions', '/legal/cookies']) {
    base(`${path} — chargée et contenu non vide`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('main')).not.toBeEmpty()
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})
