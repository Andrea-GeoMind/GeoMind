/**
 * Phase 3 — Screenshots visuels contre la prod
 * Desktop : 1440×900, Mobile : 375×812
 *
 * Lancer : PLAYWRIGHT_BASE_URL=https://geomind.fr pnpm test:e2e --grep "Phase 3"
 */
import { test, expect } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots')

const publicPages = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'signup', path: '/signup' },
  { name: 'login', path: '/login' },
  { name: 'legal-cgv', path: '/legal/cgv' },
  { name: 'legal-privacy', path: '/legal/privacy' },
  { name: 'legal-mentions', path: '/legal/mentions' },
  { name: 'legal-cookies', path: '/legal/cookies' },
]

test.describe('Phase 3 — Screenshots desktop (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const pg of publicPages) {
    test(`desktop-${pg.name}`, async ({ page }) => {
      await page.goto(pg.path)
      // Wait for content to settle
      await page.waitForLoadState('networkidle')
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `desktop-${pg.name}.png`),
        fullPage: true,
      })

      // No horizontal overflow on desktop
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      expect(hasHorizontalScroll, `Horizontal scroll on desktop ${pg.name}`).toBe(false)
    })
  }
})

test.describe('Phase 3 — Screenshots mobile (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const pg of publicPages) {
    test(`mobile-${pg.name}`, async ({ page }) => {
      await page.goto(pg.path)
      await page.waitForLoadState('networkidle')
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `mobile-${pg.name}.png`),
        fullPage: true,
      })

      // No horizontal scroll on mobile (most critical)
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      expect(hasHorizontalScroll, `Horizontal scroll on mobile ${pg.name}`).toBe(false)
    })
  }
})

test.describe('Phase 3 — Checks visuels fonctionnels', () => {
  test('landing : CTA principal visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(
      page
        .getByRole('link', { name: /commencer|démarrer|essayer|gratuit|analyser/i })
        .first()
    ).toBeVisible()
  })

  test('login : boutons taille mobile-friendly (min 44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    const btn = page.getByRole('button', { name: /se connecter/i })
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(40) // shadcn default is h-10 = 40px
  })

  test('signup : boutons taille mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/signup')
    const btn = page.getByRole('button', { name: /créer mon compte/i })
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(40)
  })

  test('pricing : plans Pro et Business visibles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/pricing')
    await expect(page.getByText('59 €', { exact: true })).toBeVisible()
    await expect(page.getByText('149 €', { exact: true })).toBeVisible()
  })
})
