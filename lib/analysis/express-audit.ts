/**
 * lib/analysis/express-audit.ts
 *
 * Audit express public (PLAN item 20) — l'aimant d'acquisition de la landing.
 * Aucun appel LLM, aucun crédit : uniquement des vérifications HTTP rapides
 * (page d'accueil + robots.txt + sitemap + llms.txt) qui donnent un avant-goût
 * honnête de l'audit complet. Budget : ~10 s maximum.
 *
 * Sécurité : fetch d'URLs arbitraires → garde anti-SSRF (schémas http(s)
 * uniquement, hôtes privés/localhost/IP littérales bloqués, ports standards).
 */

const FETCH_TIMEOUT_MS = 8_000
const MAX_HTML_BYTES = 500_000

export interface ExpressCheck {
  key: string
  label: string
  ok: boolean
  /** Une phrase de vulgarisation affichée si le check échoue */
  hint: string
}

export interface ExpressAuditResult {
  domain: string
  /** 0-100 — pondération simple des checks */
  score: number
  checks: ExpressCheck[]
  /** Temps de réponse de la page d'accueil en ms (null si échec) */
  responseTimeMs: number | null
}

// ─── Garde anti-SSRF ───────────────────────────────────────────────────────────

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[/, // IPv6 littérale
]

/**
 * Normalise l'entrée utilisateur en URL https et rejette les cibles interdites.
 * Retourne null si l'URL est invalide ou dangereuse.
 */
export function normalizePublicUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > 2_000) return null

  let url: URL
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.port && url.port !== '80' && url.port !== '443') return null
  if (url.username || url.password) return null

  const host = url.hostname
  if (!host.includes('.')) return null // pas de TLD → localhost & co
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null // IP littérale interdite
  if (PRIVATE_HOST_PATTERNS.some((p) => p.test(host))) return null

  // On audite toujours la racine du site en https
  return new URL(`https://${host}/`)
}

// ─── Fetch borné ───────────────────────────────────────────────────────────────

async function fetchText(
  url: string
): Promise<{ status: number; text: string; ms: number } | null> {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
      headers: { 'User-Agent': 'GeoMindBot/1.0 (+https://geomind.fr) audit express' },
    })
    const raw = await res.text()
    return { status: res.status, text: raw.slice(0, MAX_HTML_BYTES), ms: Date.now() - started }
  } catch {
    return null
  }
}

// ─── Checks HTML (regex volontairement simples — page d'accueil uniquement) ───

function hasTag(html: string, re: RegExp): boolean {
  return re.test(html)
}

/**
 * robots.txt : un des robots IA est-il explicitement interdit (Disallow: /) ?
 * Parsing par groupes au standard robots.txt : des lignes User-agent
 * consécutives forment un groupe ; toute directive clôt l'accumulation
 * d'agents ; le User-agent suivant ouvre un nouveau groupe.
 */
export function robotsBlocksAiBots(robotsTxt: string): boolean {
  const lines = robotsTxt.split('\n').map((l) => l.trim().toLowerCase())
  const aiBots = ['gptbot', 'claudebot', 'claude-web', 'perplexitybot', 'google-extended', '*']
  let currentAgents: string[] = []
  let collectingAgents = false
  const blockedAgents = new Set<string>()
  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      if (!collectingAgents) currentAgents = [] // nouveau groupe
      currentAgents.push(line.slice('user-agent:'.length).trim())
      collectingAgents = true
    } else if (line.startsWith('disallow:')) {
      collectingAgents = false
      const path = line.slice('disallow:'.length).trim()
      if (path === '/') currentAgents.forEach((a) => blockedAgents.add(a))
    } else if (line !== '' && !line.startsWith('#')) {
      // autre directive (allow, sitemap, crawl-delay…) : clôt l'accumulation
      collectingAgents = false
    }
  }
  return aiBots.some((bot) => blockedAgents.has(bot))
}

// ─── Audit express ─────────────────────────────────────────────────────────────

export async function runExpressAudit(target: URL): Promise<ExpressAuditResult | null> {
  const base = target.origin
  const home = await fetchText(base + '/')

  // Site injoignable → pas de résultat (le front affiche un message dédié)
  if (!home || home.status >= 500) return null

  const [robots, sitemap, llms] = await Promise.all([
    fetchText(base + '/robots.txt'),
    fetchText(base + '/sitemap.xml'),
    fetchText(base + '/llms.txt'),
  ])

  const html = home.text
  const robotsOk = robots !== null && robots.status === 200
  const robotsBlocks = robotsOk ? robotsBlocksAiBots(robots.text) : false

  const checks: ExpressCheck[] = [
    {
      key: 'reachable',
      label: 'Site accessible',
      ok: home.status < 400,
      hint: 'Votre page d\'accueil répond une erreur — les IA ne peuvent rien lire.',
    },
    {
      key: 'speed',
      label: 'Temps de réponse < 3 s',
      ok: home.ms < 3_000,
      hint: 'Un site lent décourage les robots des IA, qui abandonnent en cours de lecture.',
    },
    {
      key: 'title',
      label: 'Titre de page (balise title)',
      ok: hasTag(html, /<title[^>]*>[^<]{3,}<\/title>/i),
      hint: 'Sans titre, les moteurs et les IA ne savent pas de quoi parle votre page.',
    },
    {
      key: 'meta-description',
      label: 'Meta description',
      ok: hasTag(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i) ||
        hasTag(html, /<meta[^>]+content=["'][^"']{10,}["'][^>]+name=["']description["']/i),
      hint: 'Le petit résumé repris par les moteurs et les IA pour vous présenter est absent.',
    },
    {
      key: 'h1',
      label: 'Titre principal (H1)',
      ok: hasTag(html, /<h1[\s>]/i),
      hint: 'Le H1 annonce le sujet de la page — les IA s\'y fient beaucoup.',
    },
    {
      key: 'lang',
      label: 'Langue déclarée',
      ok: hasTag(html, /<html[^>]+lang=/i),
      hint: 'Sans attribut de langue, les IA peuvent vous classer dans la mauvaise langue.',
    },
    {
      key: 'json-ld',
      label: 'Données structurées (Schema.org)',
      ok: hasTag(html, /application\/ld\+json/i),
      hint: 'Les étiquettes invisibles qui présentent vos infos aux IA sont absentes.',
    },
    {
      key: 'open-graph',
      label: 'Balises Open Graph',
      ok: hasTag(html, /<meta[^>]+property=["']og:/i),
      hint: 'Vos pages n\'ont pas d\'aperçu riche quand elles sont partagées ou citées.',
    },
    {
      key: 'robots',
      label: 'robots.txt présent et ouvert aux IA',
      ok: robotsOk && !robotsBlocks,
      hint: robotsBlocks
        ? 'Votre robots.txt INTERDIT l\'accès aux robots des IA — vous êtes invisible volontairement.'
        : 'Le fichier robots.txt est introuvable — les robots avancent à l\'aveugle.',
    },
    {
      key: 'sitemap',
      label: 'Sitemap XML',
      ok: sitemap !== null && sitemap.status === 200 && sitemap.text.includes('<'),
      hint: 'Sans plan du site, les moteurs et les IA peuvent rater des pages.',
    },
    {
      key: 'llms-txt',
      label: 'Fichier llms.txt',
      ok: llms !== null && llms.status === 200 && llms.text.trim().length > 0,
      hint: 'La carte de visite de votre site pour les IA n\'existe pas (2 minutes à créer).',
    },
  ]

  const passed = checks.filter((c) => c.ok).length
  const score = Math.round((passed / checks.length) * 100)

  return {
    domain: target.hostname.replace(/^www\./, ''),
    score,
    checks,
    responseTimeMs: home.ms,
  }
}
