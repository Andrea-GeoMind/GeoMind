import FirecrawlApp from '@mendable/firecrawl-js'
import { normalizePublicUrl, runExpressAudit } from '@/lib/analysis/express-audit'
import { evaluateTechnicalRules } from '@/lib/analysis/technical'
import { evaluateContentRules } from '@/lib/analysis/content'
import { PlacesSource } from './sources/places'
import { crawlProspect, PROSPECT_MAX_PAGES } from './crawl'
import { isFranchise, detectSharedDomains, isEmergencyService } from './franchises'
import { findContactEmail } from './email'
import { topIssues } from './issues'
import { writeCsv, sortByScore, summarise, averageScore } from './csv'
import { platformSubdomain } from './platform'
import { roundRobin } from './select'
import { DEFAULT_FILTERS, type Business, type Prospect } from './types'

/**
 * Prospection — chaîne complète, sans aucun appel LLM.
 *
 * Source Google Places, puis pour chaque entreprise retenue : audit express
 * (11 vérifications HTTP), crawl Firecrawl borné, moteur des 57 règles
 * technique + contenu, extraction d'email. Les piliers Autorité et Réputation
 * sont volontairement exclus : ce sont les seuls à consommer des crédits
 * OpenRouter.
 *
 * Usage :
 *   GOOGLE_PLACES_API_KEY=... pnpm tsx scripts/prospection/index.ts --limit 30
 *   ... --dry-run     recherche et filtre seulement, aucune dépense Firecrawl
 */

const CATEGORIES = [
  'paysagiste',
  'cuisiniste',
  'électricien rénovation',
  "architecte d'intérieur",
  'photographe mariage',
  'déménageur',
  'menuisier',
  'carreleur',
  'plombier chauffagiste',
]

const AREA = 'Lyon'

interface Options {
  limit: number
  dryRun: boolean
  maxPages: number
  /** Plafond de crédits Firecrawl — la série s'arrête avant de le dépasser. */
  creditBudget: number
  out: string
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
  }
  return {
    limit: Number(get('--limit', '30')),
    dryRun: argv.includes('--dry-run'),
    maxPages: Number(get('--max-pages', String(PROSPECT_MAX_PAGES))),
    creditBudget: Number(get('--credit-budget', '150')),
    out: get('--out', 'PROSPECTS.csv'),
  }
}

async function firecrawlCredits(apiKey: string): Promise<number | null> {
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/team/credit-usage', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    })
    const j = (await res.json()) as { data?: { remainingCredits?: number } }
    return j.data?.remainingCredits ?? null
  } catch {
    return null
  }
}

/** Filtres : site obligatoire, fourchette d'avis, hors franchises et dépannage. */
function keep(b: Business, sharedDomains: Set<string>): boolean {
  if (DEFAULT_FILTERS.requireWebsite && !b.website) return false
  if (b.reviewCount === null) return false
  if (b.reviewCount < DEFAULT_FILTERS.minReviews) return false
  if (b.reviewCount > DEFAULT_FILTERS.maxReviews) return false
  if (isFranchise(b.name, b.website)) return false
  // Cherché dans le nom ET l'URL : « Atelier 2 Créqui » sur
  // depannage-electricien-lyon.fr était passé au travers.
  if (isEmergencyService(b.name, b.website)) return false
  if (b.website) {
    try {
      const host = new URL(b.website).hostname.replace(/^www\./, '').toLowerCase()
      if (sharedDomains.has(host)) return false
    } catch {
      return false
    }
  }
  return true
}


async function auditOne(
  app: FirecrawlApp,
  b: Business,
  maxPages: number
): Promise<Prospect> {
  const base: Prospect = {
    ...b,
    email: null,
    expressScore: null,
    technicalScore: null,
    contentScore: null,
    topIssues: [],
  }

  const target = b.website ? normalizePublicUrl(b.website) : null
  if (!target) return { ...base, error: 'URL inexploitable' }

  // 1. Audit express — aucune dépense, aucune base.
  try {
    const express = await runExpressAudit(target)
    base.expressScore = express?.score ?? null
    if (!express) return { ...base, error: 'site injoignable' }
  } catch {
    return { ...base, error: 'audit express en échec' }
  }

  // 2. Crawl + les 57 règles.
  try {
    const pages = await crawlProspect(app, target.toString(), maxPages)
    if (pages.length === 0) return { ...base, error: 'crawl vide' }

    const [tech, content] = await Promise.all([
      evaluateTechnicalRules(pages, target.toString(), maxPages),
      evaluateContentRules(pages, target.toString(), maxPages),
    ])
    base.technicalScore = tech.score
    base.contentScore = content.score
    base.topIssues = topIssues(tech.issues, content.issues)
  } catch (err) {
    base.error = `analyse : ${err instanceof Error ? err.message : String(err)}`
  }

  // 3. Email — après l'audit : inutile de solliciter un site déjà en échec.
  try {
    base.email = await findContactEmail(target.toString())
  } catch {
    // Absence d'email : le prospect reste exploitable par téléphone.
  }

  return base
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))

  const placesKey = process.env.GOOGLE_PLACES_API_KEY
  if (!placesKey) {
    console.error('GOOGLE_PLACES_API_KEY manquante — export la variable avant de lancer.')
    process.exit(1)
  }
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey && !opts.dryRun) {
    console.error('FIRECRAWL_API_KEY manquante.')
    process.exit(1)
  }

  // ── Recherche ──────────────────────────────────────────────────────────────
  const source = new PlacesSource(placesKey)
  const perCategory = Math.ceil((opts.limit * 3) / CATEGORIES.length)
  const found: Business[] = []

  for (const category of CATEGORIES) {
    process.stdout.write(`  recherche « ${category} »… `)
    try {
      const rows = await source.search(category, AREA, perCategory)
      found.push(...rows)
      console.log(`${rows.length} résultats`)
    } catch (err) {
      console.log(`échec — ${err instanceof Error ? err.message : err}`)
    }
  }

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const sharedDomains = detectSharedDomains(found.map((b) => b.website))
  const seen = new Set<string>()
  const eligible = found.filter((b) => {
    if (seen.has(b.sourceId)) return false
    seen.add(b.sourceId)
    return keep(b, sharedDomains)
  })

  console.log(
    `\n${found.length} trouvées, ${eligible.length} éligibles ` +
      `(site + ${DEFAULT_FILTERS.minReviews}–${DEFAULT_FILTERS.maxReviews} avis, hors franchises)`
  )
  console.log(`requêtes Places facturées : ${source.requestCount}`)

  // Sélection en tourniquet entre catégories. `slice` prenait les résultats
  // dans l'ordre de recherche : au premier essai, 8 paysagistes et 7
  // électriciens occupaient la moitié des 30, et menuisiers, carreleurs et
  // déménageurs n'apparaissaient pas du tout.
  const selected = roundRobin(eligible, opts.limit).map((b) => ({
    ...b,
    platform: platformSubdomain(b.website),
  }))

  // ── Garde-fou de dépense ───────────────────────────────────────────────────
  const estimated = selected.length * opts.maxPages
  const remaining = firecrawlKey ? await firecrawlCredits(firecrawlKey) : null
  console.log(
    `\nFirecrawl : ${selected.length} sites × ${opts.maxPages} pages = ~${estimated} crédits` +
      (remaining !== null ? ` (solde ${remaining})` : '')
  )

  if (opts.dryRun) {
    console.log('\n--dry-run : arrêt avant toute dépense.')
    for (const b of selected) {
      const flag = b.platform ? `  [${b.platform}]` : ''
      console.log(`  ${b.category.padEnd(22)} ${b.name} — ${b.reviewCount} avis — ${b.website}${flag}`)
    }
    const onPlatform = selected.filter((b) => b.platform).length
    if (onPlatform > 0) console.log(`\n  dont ${onPlatform} sans domaine propre (prioritaires)`)
    return
  }
  if (estimated > opts.creditBudget) {
    console.error(
      `\nARRÊT : ${estimated} crédits dépasseraient le plafond de ${opts.creditBudget}. ` +
        `Réduisez --limit ou --max-pages.`
    )
    process.exit(1)
  }
  if (remaining !== null && estimated > remaining) {
    console.error(`\nARRÊT : solde insuffisant (${remaining} crédits).`)
    process.exit(1)
  }

  // ── Audits ─────────────────────────────────────────────────────────────────
  const app = new FirecrawlApp({ apiKey: firecrawlKey! })
  const prospects: Prospect[] = []

  for (const [i, b] of selected.entries()) {
    process.stdout.write(`  [${i + 1}/${selected.length}] ${b.name}… `)
    const p = await auditOne(app, b, opts.maxPages)
    prospects.push(p)
    const avg = averageScore(p)
    console.log(p.error ? `échec (${p.error})` : `moyenne ${avg} — ${p.email ?? 'sans email'}`)
  }

  // ── Sortie ─────────────────────────────────────────────────────────────────
  const sorted = sortByScore(prospects)
  writeCsv(opts.out, sorted)
  const s = summarise(sorted)

  console.log(`\n${opts.out} écrit.`)
  console.log(`  audités avec succès : ${s.audited}/${s.total}${s.failed ? ` (${s.failed} en échec)` : ''}`)
  console.log(`  avec email          : ${s.withEmail}`)
  console.log(`  sans domaine propre : ${s.onPlatform}`)
  console.log(`  sous 70             : ${s.under70}`)
  console.log(`  sous 60             : ${s.under60}`)
  console.log(`  sous 50             : ${s.under50}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
