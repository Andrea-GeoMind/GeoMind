/**
 * Smoke tests — vérifient que les pages publiques chargent correctement.
 * Lancer sur prod : PLAYWRIGHT_BASE_URL=https://geomind.fr pnpm test:e2e
 */
import { test, expect } from '@playwright/test'

test.describe('Pages publiques', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/GeoMind/i)
    await expect(page.getByRole('link', { name: /commencer|démarrer|essayer|gratuit/i }).first()).toBeVisible()
  })

  test('page pricing', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('49')).toBeVisible()
    await expect(page.getByText('149')).toBeVisible()
  })

  test('page login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })

  test('page signup', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /inscription|créer|compte/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /créer|s'inscrire|commencer/i })).toBeVisible()
  })
})

test.describe('Pages légales', () => {
  for (const path of ['/legal/mentions', '/legal/privacy', '/legal/cgv', '/legal/cookies']) {
    test(path, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('main')).not.toBeEmpty()
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})

test.describe('Auth redirect', () => {
  test('/dashboard redirige vers /login sans session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/settings redirige vers /login sans session', async ({ page }) => {
    await page.goto('/settings/billing')
    await expect(page).toHaveURL(/\/login/)
  })
})
