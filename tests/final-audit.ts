/**
 * Test bout-en-bout final — audit MVP GeoMind en production
 * Lance : npx tsx tests/final-audit.ts
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import * as fs from 'fs'
import * as path from 'path'

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://geomind.fr'
const SUPABASE_URL = 'https://jiuruhaeckqwysyqwbao.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdXJ1aGFlY2txd3lzeXF3YmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzU5OTQsImV4cCI6MjA5MzY1MTk5NH0.c9vOI1-YBwuj6dVs81gFDegpCCZara0Oq3_yu02HMfU'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdXJ1aGFlY2txd3lzeXF3YmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA3NTk5NCwiZXhwIjoyMDkzNjUxOTk0fQ.3m0tYuT-ajc9c7dZeg7Z5ytXqBZI7FLnW2K_pxlmQDY'
const DATABASE_URL =
  'postgresql://postgres.jiuruhaeckqwysyqwbao:OKM3ondpOZFw4kFa@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'

const TEST_EMAIL = `audit-final-${Date.now()}@example.com`
const TEST_PASSWORD = 'Audit$Final2026!'
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests/final-audit-screenshots')

const report: Record<string, boolean | string | number> = {}

function log(msg: string) { console.log(`[${new Date().toISOString().substring(11, 19)}] ${msg}`) }
function ok(key: string, detail?: string) { report[key] = true; log(`✅ ${key}${detail ? ' — ' + detail : ''}`) }
function fail(key: string, detail?: string) { report[key] = false; log(`❌ ${key}${detail ? ' — ' + detail : ''}`) }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const sql = postgres(DATABASE_URL, { max: 5, idle_timeout: 20 })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
  })
  const page = await context.newPage()

  async function dismissCookies() {
    try {
      const d = page.locator('[role="dialog"][aria-label*="ookie" i]')
      if (await d.isVisible({ timeout: 2_000 })) {
        await d.getByRole('button').first().click()
        await page.waitForTimeout(300)
      }
    } catch { /* ignore */ }
  }

  async function screenshot(name: string) {
    const p = path.join(SCREENSHOTS_DIR, `${name}.png`)
    await page.screenshot({ path: p, fullPage: true })
    return p
  }

  let userId: string | null = null
  let siteId: string | null = null
  let analysisId: string | null = null

  try {
    // ── Créer le compte via Admin API ──────────────────────────────────────────
    log(`Création du compte : ${TEST_EMAIL}`)
    const { data: signupData, error: signupErr } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true,
    })
    if (signupErr || !signupData?.user) throw new Error('Signup failed: ' + signupErr?.message)
    userId = signupData.user.id
    ok('signup', `userId=${userId}`)

    // ── Se connecter via REST API pour obtenir les tokens ──────────────────────
    log('Sign-in via REST API Supabase…')
    const signinResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    const session = await signinResp.json() as Record<string, unknown>
    if (!session.access_token) throw new Error('REST sign-in failed: ' + JSON.stringify(session))
    ok('rest_signin', 'access_token obtenu')

    // ── Injecter la session Supabase dans Playwright (format base64- de @supabase/ssr) ──
    // @supabase/ssr stocke: "base64-" + btoa(JSON.stringify(session))
    const sessionJson = JSON.stringify(session)
    const base64Session = Buffer.from(sessionJson).toString('base64')
    const cookieValue = `base64-${base64Session}`
    const projectRef = 'jiuruhaeckqwysyqwbao'

    await context.addCookies([{
      name: `sb-${projectRef}-auth-token`,
      value: cookieValue,
      domain: 'geomind.fr',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }])
    ok('session_injected', 'cookie sb-...-auth-token injecté')

    // ── Vérifier que le navigateur est bien connecté ───────────────────────────
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    const dashboardUrl = page.url()
    if (/dashboard/.test(dashboardUrl)) {
      ok('login', `URL: ${dashboardUrl}`)
    } else {
      fail('login', `URL inattendue: ${dashboardUrl}`)
      // Fallback : login via UI
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')
      await dismissCookies()
      await page.fill('input[type="email"]', TEST_EMAIL)
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('text=Se connecter')
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
      ok('login_fallback', page.url())
    }

    // ── Passer en Pro via DB ───────────────────────────────────────────────────
    const updated = await sql`
      UPDATE subscriptions SET plan='pro', status='active', updated_at=NOW()
      WHERE user_id=${userId} RETURNING id
    `
    if (updated.length === 0) {
      await sql`INSERT INTO subscriptions (user_id, plan, status, created_at, updated_at)
                VALUES (${userId}, 'pro', 'active', NOW(), NOW())`
    }
    ok('pro_upgrade')

    // ── Onboarding step=2 ─────────────────────────────────────────────────────
    log('Navigation vers /onboarding?step=2…')
    await page.goto(`${BASE_URL}/onboarding?step=2`)
    await page.waitForLoadState('networkidle')
    await dismissCookies()

    await page.waitForSelector('input#name', { timeout: 10_000 })

    log('Remplissage du formulaire…')
    await page.fill('input#name', 'Test Audit Final')
    await page.fill('input#url', 'https://example.com')

    await screenshot('00_onboarding_form')

    // NOTE: Ne PAS utiliser button[type="submit"] car le bouton Déconnexion
    // dans la sidebar a aussi type="submit" et apparaît en premier dans le DOM.
    // Utiliser le texte exact du bouton de soumission du formulaire.
    log('Clic sur "Analyser mon site"…')
    await page.click('text=Analyser mon site')

    log('Attente redirection vers step=3…')
    await page.waitForURL(/step=3/, { timeout: 30_000 })
    ok('form_submitted', page.url())
    await screenshot('01_onboarding_step3')

    // ── Récupérer siteId en DB ─────────────────────────────────────────────────
    const siteRows = await sql`
      SELECT id FROM sites WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 1
    `
    siteId = siteRows[0]?.id ?? null
    siteId ? ok('site_created', `siteId=${siteId}`) : fail('site_created', 'absent en DB')

    // ── Attente découverte (max 3 min, poll 10s) ───────────────────────────────
    log('Attente crawl + découverte…')
    let discoveryDone = false
    for (let i = 0; i < 18; i++) {
      await new Promise((r) => setTimeout(r, 10_000))
      if (siteId) {
        const [meta] = await sql`SELECT description FROM site_metadata WHERE site_id=${siteId}`
        if (meta?.description) {
          discoveryDone = true
          ok('discovery_done', `"${meta.description.substring(0, 50)}…"`)
          break
        }
        log(`Poll découverte ${i + 1}/18 — pas encore`)
      }
    }
    if (!discoveryDone) fail('discovery_done', 'timeout 3 min')

    // ── Vérifier démarrage de l'analyse ───────────────────────────────────────
    const analysisRows = await sql`
      SELECT id, status FROM analyses WHERE site_id=${siteId ?? ''}
      ORDER BY created_at DESC LIMIT 1
    `
    if (analysisRows.length > 0) {
      analysisId = analysisRows[0].id
      ok('analysis_started', `status=${analysisRows[0].status}`)
    } else {
      fail('analysis_started', 'absent en DB')
    }

    // ── Attendre status=success (max 5 min, poll 30s) ─────────────────────────
    log('Attente analyse complète…')
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 30_000))
      if (analysisId) {
        const [row] = await sql`
          SELECT status, global_score, authority_score, technical_score, content_score
          FROM analyses WHERE id=${analysisId}
        `
        if (!row) break
        log(`Poll ${i + 1}/10 — status=${row.status} scores=${row.global_score}/${row.authority_score}/${row.technical_score}/${row.content_score}`)
        if (row.status === 'success') {
          report['global_score'] = row.global_score ?? 0
          report['authority_score'] = row.authority_score ?? 0
          report['technical_score'] = row.technical_score ?? 0
          report['content_score'] = row.content_score ?? 0
          ok('analysis_complete', `G=${row.global_score} A=${row.authority_score} T=${row.technical_score} C=${row.content_score}`)
          break
        }
        if (row.status === 'error') { fail('analysis_complete', 'status=error'); break }
      }
    }
    if (!report['analysis_complete']) fail('analysis_complete', 'timeout')

    // ── Screenshots des onglets ────────────────────────────────────────────────
    if (siteId) {
      const tabs = [
        { slug: 'overview', name: '02_overview', check: /score|note|global|GEO/i },
        { slug: 'authority', name: '03_authority', check: /autorité|citation|IA|moteur/i },
        { slug: 'technical', name: '04_technical', check: /technique|technical|règle|score/i },
        { slug: 'content', name: '05_content', check: /contenu|content|issue|règle/i },
        { slug: 'publishers', name: '06_publishers', check: /publisher|éditeur|média/i },
      ]
      for (const tab of tabs) {
        await page.goto(`${BASE_URL}/sites/${siteId}/${tab.slug}`)
        await page.waitForLoadState('networkidle')
        await dismissCookies()
        await new Promise((r) => setTimeout(r, 2_000))
        const p = await screenshot(tab.name)
        const bodyText = await page.locator('body').textContent().catch(() => '')
        tab.check.test(bodyText ?? '')
          ? ok(`screenshot_${tab.slug}`, p)
          : fail(`screenshot_${tab.slug}`, `check ${tab.check} not matched`)
      }
    } else {
      fail('screenshots', 'siteId unavailable')
    }

    // ── Vérifications DB ───────────────────────────────────────────────────────
    if (analysisId) {
      const [c] = await sql`
        SELECT
          (SELECT COUNT(*) FROM authority_results WHERE analysis_id=${analysisId}) as auth,
          (SELECT COUNT(*) FROM technical_issues WHERE analysis_id=${analysisId}) as tech,
          (SELECT COUNT(*) FROM content_issues WHERE analysis_id=${analysisId}) as content,
          (SELECT COUNT(*) FROM recommendations WHERE analysis_id=${analysisId}) as reco,
          (SELECT COUNT(*) FROM publishers WHERE analysis_id=${analysisId}) as pub
      `
      report['authority_results_count'] = Number(c.auth)
      report['technical_issues_count'] = Number(c.tech)
      report['content_issues_count'] = Number(c.content)
      report['recommendations_count'] = Number(c.reco)
      report['publishers_count'] = Number(c.pub)

      Number(c.auth) > 0 ? ok('db_authority_results', `count=${c.auth}`) : fail('db_authority_results', `count=${c.auth}`)
      Number(c.tech) > 0 ? ok('db_technical_issues', `count=${c.tech}`) : fail('db_technical_issues', `count=${c.tech}`)
      Number(c.content) > 0 ? ok('db_content_issues', `count=${c.content}`) : fail('db_content_issues', `count=${c.content}`)
      Number(c.reco) > 0 ? ok('db_recommendations', `count=${c.reco}`) : fail('db_recommendations', `count=${c.reco}`)
      Number(c.pub) === 15 ? ok('db_publishers', `count=${c.pub} ✓`) : fail('db_publishers', `count=${c.pub} (expected 15)`)
    } else {
      fail('db_checks', 'no analysisId')
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`ERREUR FATALE: ${msg}`)
    report['fatal_error'] = msg
    await screenshot('99_error').catch(() => {})
  } finally {
    if (userId) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      error ? fail('cleanup', error.message) : ok('cleanup', `${userId} supprimé`)
    }
    await browser.close()
    await sql.end()
  }
  return report
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().then((report) => {
  log('\n── Résumé final ────────────────────────────────────────')
  for (const [k, v] of Object.entries(report)) {
    const icon = v === true ? '✅' : v === false ? '❌' : '  '
    log(`${icon} ${k}: ${v}`)
  }
  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'report.json'),
    JSON.stringify(report, null, 2),
  )
  log('\nJSON: tests/final-audit-screenshots/report.json')
}).catch((err) => {
  console.error('CRASH:', err)
  process.exit(1)
})
