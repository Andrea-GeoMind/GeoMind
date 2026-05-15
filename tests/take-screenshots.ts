/**
 * Capture screenshots des 5 onglets du site dopamine-tech.com (compte dev)
 */
import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'https://geomind.fr'
const SUPABASE_URL = 'https://jiuruhaeckqwysyqwbao.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdXJ1aGFlY2txd3lzeXF3YmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzU5OTQsImV4cCI6MjA5MzY1MTk5NH0.c9vOI1-YBwuj6dVs81gFDegpCCZara0Oq3_yu02HMfU'
const SITE_ID = 'b37c2150-e3fe-4f32-9dd9-383c1a631cda'
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests/final-audit-screenshots')

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  // Sign in as claire dev
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'claire@test.geomind.fr', password: 'geomind-dev-2026' }),
  })
  const session = await resp.json()
  console.log('Claire signin status:', resp.status, !!session.access_token)
  if (!session.access_token) { console.error('Signin failed:', session); return }

  const sessionJson = JSON.stringify(session)
  const b64 = Buffer.from(sessionJson).toString('base64')
  const cookieValue = `base64-${b64}`

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' })

  await context.addCookies([{
    name: 'sb-jiuruhaeckqwysyqwbao-auth-token',
    value: cookieValue,
    domain: 'geomind.fr',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])

  const page = await context.newPage()

  async function dismissCookies() {
    const d = page.locator('[role="dialog"][aria-label*="ookie" i]')
    if (await d.isVisible({ timeout: 2000 }).catch(() => false)) {
      await d.getByRole('button').first().click()
      await page.waitForTimeout(300)
    }
  }

  const tabs = [
    { slug: 'overview', name: '02_overview' },
    { slug: 'authority', name: '03_authority' },
    { slug: 'technical', name: '04_technical' },
    { slug: 'content', name: '05_content' },
    { slug: 'publishers', name: '06_publishers' },
  ]

  for (const tab of tabs) {
    await page.goto(`${BASE_URL}/sites/${SITE_ID}/${tab.slug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookies()
    await new Promise(r => setTimeout(r, 2000))
    const p = path.join(SCREENSHOTS_DIR, `${tab.name}.png`)
    await page.screenshot({ path: p, fullPage: true })
    console.log(`✅ ${tab.name} — ${p}`)
    const bodyText = await page.locator('body').textContent().catch(() => '')
    console.log(`   Preview: ${bodyText?.substring(0, 100)?.replace(/\s+/g, ' ')}`)
  }

  await browser.close()
  console.log('Screenshots done')
}

main().catch(console.error)
