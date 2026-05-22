/**
 * Debug script — vérifie les cookies après login et teste le Server Action
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://geomind.fr'
const SUPABASE_URL = 'https://jiuruhaeckqwysyqwbao.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdXJ1aGFlY2txd3lzeXF3YmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzU5OTQsImV4cCI6MjA5MzY1MTk5NH0.c9vOI1-YBwuj6dVs81gFDegpCCZara0Oq3_yu02HMfU'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdXJ1aGFlY2txd3lzeXF3YmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA3NTk5NCwiZXhwIjoyMDkzNjUxOTk0fQ.3m0tYuT-ajc9c7dZeg7Z5ytXqBZI7FLnW2K_pxlmQDY'

const EMAIL = `debug-${Date.now()}@example.com`
const PASSWORD = 'Debug$Test2026!'

async function main() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Create user
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
  })
  const userId = data.user!.id
  console.log('User created:', userId)

  // Sign in via REST (not browser) to get tokens
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const session = await resp.json()
  console.log('REST sign-in status:', resp.status)
  console.log('Session keys:', Object.keys(session))
  console.log('access_token present:', !!session.access_token)
  console.log('refresh_token present:', !!session.refresh_token)

  if (!session.access_token) {
    console.error('FAILED to get session:', session)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return
  }

  // Now check what cookies the browser login sets
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')

  // Dismiss cookies if present
  const cookieDialog = page.locator('[role="dialog"][aria-label*="ookie" i]')
  if (await cookieDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieDialog.getByRole('button').first().click()
    await page.waitForTimeout(500)
    console.log('Cookie banner dismissed')
  }

  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
  console.log('After login URL:', page.url())

  // Get all cookies
  const cookies = await context.cookies()
  console.log('\n=== COOKIES AFTER LOGIN ===')
  for (const c of cookies) {
    console.log(`  [${c.domain}] ${c.name} = ${c.value.substring(0, 80)}...`)
  }

  const supabaseCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
  console.log('\nSupabase cookies:', supabaseCookies.map(c => c.name))

  // Navigate to onboarding step 2 and check if accessible
  await page.goto(`${BASE_URL}/onboarding?step=2`)
  await page.waitForLoadState('networkidle')
  console.log('\nOnboarding?step=2 URL:', page.url())
  const hasForm = await page.locator('input#name').isVisible({ timeout: 5000 }).catch(() => false)
  console.log('Form visible:', hasForm)

  // Try injecting Supabase session cookie directly
  const sessionStr = JSON.stringify(session)
  console.log('\nSession JSON length:', sessionStr.length)

  // Inject session as chunked cookies (format used by @supabase/ssr)
  const CHUNK_SIZE = 3180
  const projectRef = 'jiuruhaeckqwysyqwbao'
  const cookieBase = `sb-${projectRef}-auth-token`
  const encoded = encodeURIComponent(sessionStr)
  console.log('Encoded session length:', encoded.length)

  if (encoded.length <= CHUNK_SIZE) {
    await context.addCookies([{
      name: cookieBase,
      value: encoded,
      domain: 'geomind.fr',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }])
    console.log('Injected single cookie:', cookieBase)
  } else {
    // Split into chunks
    let i = 0
    let offset = 0
    while (offset < encoded.length) {
      const chunk = encoded.slice(offset, offset + CHUNK_SIZE)
      await context.addCookies([{
        name: `${cookieBase}.${i}`,
        value: chunk,
        domain: 'geomind.fr',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      }])
      console.log(`Injected chunk cookie: ${cookieBase}.${i} (len=${chunk.length})`)
      offset += CHUNK_SIZE
      i++
    }
  }

  // Navigate to onboarding?step=2 after injecting cookies
  await page.goto(`${BASE_URL}/onboarding?step=2`)
  await page.waitForLoadState('networkidle')
  console.log('\nAfter cookie injection URL:', page.url())
  const hasFormAfterInject = await page.locator('input#name').isVisible({ timeout: 5000 }).catch(() => false)
  console.log('Form visible after injection:', hasFormAfterInject)

  if (hasFormAfterInject) {
    await page.fill('input#name', 'Debug Test')
    await page.fill('input#url', 'https://example.com')

    // Intercept navigation
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log('Navigation to:', frame.url())
      }
    })

    console.log('Clicking Analyser mon site...')
    await page.click('text=Analyser mon site')

    await page.waitForTimeout(5000)
    console.log('URL after submit:', page.url())
  }

  await page.screenshot({ path: 'tests/final-audit-screenshots/debug_final.png', fullPage: true })
  await browser.close()

  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {})
  console.log('Done')
}

main().catch(console.error)
