import FirecrawlApp from '@mendable/firecrawl-js'
import { normalizePublicUrl, runExpressAudit } from '@/lib/analysis/express-audit'
import { evaluateTechnicalRules } from '@/lib/analysis/technical'
import { evaluateContentRules } from '@/lib/analysis/content'
import { PlacesSource } from './sources/places'
import { crawlProspect, PROSPECT_MAX_PAGES } from './crawl'
import { isFranchise, detectSharedDomains, isEmergencyService } from './franchises'
import { findContactEmail } from './email'
import { topIssues } from './issues'
import { neglectScore, neglectSignals } from './neglect'
import { writeCsv, writeListingsCsv, sortByScore, summarise, averageScore } from './csv'
import { platformSubdomain, isCitySubdomain } from './platform'
import { listingPlatform } from './listing'
import { isNetworkSite } from './network'
import { roundRobin } from './select'
import { getSeries, type Series } from './series'
import { budgetRefusal } from './budget'
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
 *   ... --series commerces   jeu de catégories (défaut : artisans)
 *   ... --dry-run     recherche et filtre seulement, aucune dépense Firecrawl
 *
 * La série refuse de démarrer si elle laisserait moins de `PRODUCTION_RESERVE`
 * crédits Firecrawl — les analyses clientes passent avant la prospection.
 */

interface Options {
  series: Series
  limit: number
  dryRun: boolean
  maxPages: number
  /** Plafond de crédits Firecrawl — la série s'arrête avant de le dépasser. */
  creditBudget: number
  /** Lève la réserve de production — à n'utiliser qu'en connaissance de cause. */
  ignoreReserve: boolean
  out: string
  /** Fichier des entreprises sans site propre — argumentaire différent. */
  listingsOut: string
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
  }
  const series = getSeries(get('--series', 'artisans'))
  return {
    series,
    limit: Number(get('--limit', '30')),
    dryRun: argv.includes('--dry-run'),
    maxPages: Number(get('--max-pages', String(PROSPECT_MAX_PAGES))),
    creditBudget: Number(get('--credit-budget', '150')),
    ignoreReserve: argv.includes('--ignore-reserve'),
    // Un fichier par série : la première a écrit PROSPECTS.csv, une seconde
    // série ne doit pas l'écraser en silence.
    out: get('--out', series.key === 'artisans' ? 'PROSPECTS.csv' : `PROSPECTS-${series.key}.csv`),
    listingsOut: get('--listings-out', `PROSPECTS-${series.key}-sans-site.csv`),
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

/**
 * Filtres : site obligatoire, fourchette d'avis, hors franchises et dépannage.
 * Renvoie le motif de rejet, ou null quand l'entreprise est retenue.
 */
function rejectReason(
  b: Business,
  sharedDomains: Set<string>,
  series: Series
): string | null {
  if (DEFAULT_FILTERS.requireWebsite && !b.website) return 'sans site'
  if (b.reviewCount === null) return 'avis inconnus'
  if (b.reviewCount < DEFAULT_FILTERS.minReviews) return 'trop peu d’avis'
  if (b.reviewCount > DEFAULT_FILTERS.maxReviews) return 'trop d’avis'
  if (isFranchise(b.name, b.website)) return 'franchise'
  // Cherché dans le nom ET l'URL : « Atelier 2 Créqui » sur
  // depannage-electricien-lyon.fr était passé au travers.
  if (series.excludeEmergency && isEmergencyService(b.name, b.website)) return 'dépannage'
  // Antenne locale d'un réseau national : `lyon.plomberie-roche.fr`.
  if (isCitySubdomain(b.website)) return 'sous-domaine de ville'
  // Fiche Planity, Instagram, TheFork… : la page appartient à la plateforme,
  // il n'y a pas de site propre à auditer.
  const listing = listingPlatform(b.website)
  if (listing) return `fiche ${listing}`
  const host = hostOf(b.website)
  if (b.website && !host) return 'URL illisible'
  if (host && sharedDomains.has(host)) return 'domaine partagé'
  return null
}

/** Hôte normalisé, pour dédupliquer deux établissements d'un même site. */
function hostOf(website: string | null): string | null {
  if (!website) return null
  try {
    return new URL(website).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

const STOP_WORDS = new Set([
  'lyon', 'institut', 'studio', 'salle', 'sport', 'club', 'beaute', 'cave',
  'vins', 'epicerie', 'fine', 'coworking', 'espace', 'barber', 'coiffeur',
  'restaurant', 'atelier', 'maison', 'bureaux', 'pilates', 'yoga', 'crossfit',
  'bien', 'etre', 'chez', 'centre', 'boutique', 'lyonnais',
])

/**
 * Vrai si au moins un mot significatif du nom se retrouve dans le domaine.
 *
 * Alerte, pas filtre : beaucoup d'entreprises ont un domaine qui ne reprend
 * pas leur nom. Mais « Le Petit Institut » sur `latelierderetouches.fr`
 * signale une association douteuse chez Places, à vérifier avant d'écrire.
 */
export function nameMatchesHost(name: string, website: string | null): boolean {
  const host = hostOf(website)
  if (!host) return true
  const flat = host.replace(/[^a-z0-9]/g, '')
  const words = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
  if (words.length === 0) return true
  return words.some((w) => flat.includes(w))
}

/**
 * Sélection en tourniquet, puis contrôle réseau sur la page d'accueil des
 * retenus. Chaque écarté est remplacé par le candidat suivant, pour que la
 * série fasse bien `limit` entreprises et reste équilibrée entre catégories.
 */
async function selectScreened(
  pool: Business[],
  limit: number
): Promise<{ kept: Business[]; networks: { business: Business; evidence?: string }[] }> {
  const kept: Business[] = []
  const networks: { business: Business; evidence?: string }[] = []
  let pending = [...pool]

  while (kept.length < limit && pending.length > 0) {
    const batch = roundRobin(pending, limit - kept.length)
    if (batch.length === 0) break
    const taken = new Set(batch.map((b) => b.sourceId))
    pending = pending.filter((b) => !taken.has(b.sourceId))

    for (const b of batch) {
      const verdict = await isNetworkSite(b.website)
      if (verdict.isNetwork) networks.push({ business: b, evidence: verdict.evidence })
      else kept.push(b)
    }
  }
  return { kept, networks }
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
    base.issueKeys = [...tech.issues, ...content.issues].map((i) => i.ruleKey)
  } catch (err) {
    base.error = `analyse : ${err instanceof Error ? err.message : String(err)}`
  }

  // Score de négligence : calculé une fois les règles connues.
  const signals = neglectSignals(base, base.issueKeys ?? [])
  base.neglectScore = neglectScore(base, base.issueKeys ?? [])
  base.neglectReasons = signals.map((x) => x.label)

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
  const { series } = opts
  console.log(`Série « ${series.key} » — ${series.label}`)
  if (series.note) console.log(`  note : ${series.note}`)
  console.log()

  const source = new PlacesSource(placesKey)
  // Une page Places pleine par catégorie. Demander moins ne coûte pas moins :
  // c'est une requête dans les deux cas, `pageSize` étant plafonné à 20. Au
  // dry-run du 23/09, 8 par catégorie laissaient les barbiers à zéro retenu
  // une fois les fiches Planity et les franchises écartées.
  const perCategory = Math.max(20, Math.ceil((opts.limit * 3) / series.categories.length))
  const found: Business[] = []

  for (const category of series.categories) {
    process.stdout.write(`  recherche « ${category} »… `)
    try {
      const rows = await source.search(category, series.area, perCategory)
      found.push(...rows)
      console.log(`${rows.length} résultats`)
    } catch (err) {
      console.log(`échec — ${err instanceof Error ? err.message : err}`)
    }
  }

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const sharedDomains = detectSharedDomains(found.map((b) => b.website))
  const seen = new Set<string>()
  const seenHosts = new Set<string>()
  const listings: { business: Business; platform: string }[] = []
  const eligible: Business[] = []

  for (const b of found) {
    if (seen.has(b.sourceId)) continue
    seen.add(b.sourceId)
    const reason = rejectReason(b, sharedDomains, series)
    if (reason?.startsWith('fiche ')) {
      listings.push({ business: b, platform: reason.slice('fiche '.length) })
    }
    if (reason) continue
    // Deux établissements d'une même enseigne partagent un site : l'auditer
    // deux fois coûterait le double pour un seul diagnostic. Le dry-run du
    // 23/09 avait retenu les deux adresses de CrossFit HEKA.
    const host = hostOf(b.website)
    if (host) {
      if (seenHosts.has(host)) continue
      seenHosts.add(host)
    }
    eligible.push(b)
  }

  console.log(
    `\n${found.length} trouvées, ${eligible.length} éligibles ` +
      `(site propre + ${DEFAULT_FILTERS.minReviews}–${DEFAULT_FILTERS.maxReviews} avis, hors franchises)`
  )
  console.log(`requêtes Places facturées : ${source.requestCount}`)

  // Sélection en tourniquet entre catégories. `slice` prenait les résultats
  // dans l'ordre de recherche : au premier essai, 8 paysagistes et 7
  // électriciens occupaient la moitié des 30, et menuisiers, carreleurs et
  // déménageurs n'apparaissaient pas du tout.
  const flagged = eligible.map((b) => ({ ...b, platform: platformSubdomain(b.website) }))

  // Contrôle réseau : une requête HTTP par retenu, gratuite, avant Firecrawl.
  console.log(`\ncontrôle réseau sur les pages d'accueil retenues…`)
  const { kept: selected, networks } = await selectScreened(flagged, opts.limit)
  if (networks.length > 0) {
    console.log(`  ${networks.length} écartée(s) — enseigne multi-établissements :`)
    for (const n of networks) {
      console.log(`    ${n.business.name} — « ${n.evidence ?? '?'} »`)
    }
  }

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

    const mismatched = selected.filter((b) => !nameMatchesHost(b.name, b.website))
    if (mismatched.length > 0) {
      console.log(`\n  à vérifier — nom et domaine sans mot commun :`)
      for (const b of mismatched) console.log(`    ${b.name} → ${b.website}`)
    }

    if (listings.length > 0) {
      console.log(
        `\n  ${listings.length} écartée(s) faute de site propre — fiche de plateforme, rien à auditer :`
      )
      for (const { business: b, platform } of listings) {
        console.log(
          `    ${b.category.padEnd(22)} ${b.name} — ${b.reviewCount} avis — [${platform}] ${b.website}`
        )
      }
      writeListingsCsv(opts.listingsOut, listings)
      console.log(`\n  ${opts.listingsOut} écrit.`)
    }
    return
  }
  const refusal = budgetRefusal({
    estimated,
    creditBudget: opts.creditBudget,
    remaining,
    ignoreReserve: opts.ignoreReserve,
  })
  if (refusal) {
    console.error(`\nARRÊT : ${refusal}`)
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
  if (listings.length > 0) writeListingsCsv(opts.listingsOut, listings)
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
