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

import { AI_BOTS, blockedAiBots, blocksAllBots } from '@/lib/analysis/robots-parser'

const FETCH_TIMEOUT_MS = 8_000
const MAX_HTML_BYTES = 500_000

/**
 * Nombre de vérifications de l'audit express — affiché avant même de lancer
 * un test (« Gratuit, sans inscription — N vérifications »). Doit rester égal
 * à la longueur du tableau `checks` construit dans `runExpressAudit` ; un
 * test vérifie l'accord des deux.
 */
export const EXPRESS_CHECK_COUNT = 12

/**
 * Poids par défaut d'un check dans le score (0-100). Les checks cosmétiques
 * (titre, meta description, Open Graph…) se partagent ce poids à parts égales.
 */
export const DEFAULT_CHECK_WEIGHT = 5

/**
 * Poids du check « robots.txt ouvert aux robots des IA ». Un blocage est
 * rédhibitoire : peu importe la qualité du reste, un site que GPTBot ne peut
 * pas lire ne sera jamais cité. Avec ce poids, un blocage plafonne le score à
 * ~55/100 même si tous les autres checks passent (cf. computeExpressScore) —
 * avant ce correctif, il ne coûtait qu'1/11 du score (~9 points), au même
 * niveau qu'un Open Graph manquant, ce qui rendait l'audit peu discriminant.
 */
export const AI_BOTS_BLOCK_WEIGHT = 45

export interface ExpressCheck {
  key: string
  label: string
  ok: boolean
  /** Une phrase de vulgarisation affichée si le check échoue */
  hint: string
  /** Poids dans le score final — DEFAULT_CHECK_WEIGHT si omis. */
  weight?: number
}

/**
 * Score pondéré 0-100 : chaque check compte pour son poids (DEFAULT_CHECK_WEIGHT
 * si non précisé), pas pour une simple fraction du nombre de checks. Fonction
 * pure et testée, dans l'esprit de la règle CLAUDE.md §5.9 (idempotence, pas
 * de side-effect) appliquée ici à l'audit express plutôt qu'au scoring complet.
 */
export function computeExpressScore(checks: ExpressCheck[]): number {
  const total = checks.reduce((sum, c) => sum + (c.weight ?? DEFAULT_CHECK_WEIGHT), 0)
  if (total === 0) return 0
  const earned = checks.reduce((sum, c) => sum + (c.ok ? (c.weight ?? DEFAULT_CHECK_WEIGHT) : 0), 0)
  return Math.round((earned / total) * 100)
}

/**
 * Les questions que l'audit express ne peut PAS trancher.
 *
 * L'express ne fait que des vérifications HTTP : il couvre le pilier Technique,
 * et partiellement. L'Autorité (êtes-vous cité) et le Contenu ne sont pas
 * mesurés du tout — d'où un score express qui reste souvent élevé pour un
 * site correct, alors que la note complète, moyenne des trois piliers, est
 * bien plus basse. Exception assumée : un robots.txt qui bloque les robots
 * des IA plombe le score à lui seul (cf. AI_BOTS_BLOCK_WEIGHT), parce que
 * c'est rédhibitoire pour être cité — contrairement à un Open Graph manquant,
 * qui ne coûte que quelques points.
 *
 * Afficher ces inconnues n'est donc pas un argument commercial : c'est la
 * partie manquante du périmètre, dite explicitement. On garde le vocabulaire
 * du produit — « non mesuré », jamais « 0 » (cf. lib/analysis/scoring.ts).
 */
export interface ExpressUnknown {
  key: string
  question: string
  detail: string
}

export const EXPRESS_UNKNOWNS: readonly ExpressUnknown[] = [
  {
    key: 'citations',
    question: 'Les IA vous citent-elles ?',
    detail:
      'Non mesuré — il faut poser de vraies questions de clients aux IA et lire les sources qu’elles citent.',
  },
  {
    key: 'competitors',
    question: 'Qui est cité à votre place ?',
    detail:
      'Non mesuré — les concurrents nommés dans les réponses sur votre métier, et ce qu’ils ont que vous n’avez pas.',
  },
  {
    key: 'reputation',
    question: 'Que disent les IA de vous ?',
    detail:
      'Non mesuré — horaires, adresse, activité : ce que les IA racontent sur vous peut être faux sans que vous le sachiez.',
  },
] as const

/** Nombre de piliers du score complet (autorité, technique, contenu). */
export const PILLAR_COUNT = 3

/** Piliers réellement couverts par l'audit express — le technique seul. */
export const EXPRESS_PILLARS_COVERED = 1

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
 * Bots IA effectivement bloqués par un robots.txt : les bots nommés
 * explicitement (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot —
 * lib/analysis/robots-parser.ts), ou — si `Disallow: /` s'applique à
 * `User-agent: *` — la totalité de la liste, puisqu'un bot sans groupe qui le
 * nomme tombe alors sous le groupe générique (sémantique standard de
 * robots.txt : le groupe le plus spécifique gagne, à défaut c'est `*` qui
 * s'applique).
 *
 * Consolide en un seul signal ce que l'analyse complète traite comme deux
 * règles distinctes (robots_txt_block_all et robots_txt_block_ai_bots) :
 * l'audit express n'a qu'un check à afficher, pas deux.
 */
export function effectivelyBlockedAiBots(robotsText: string): string[] {
  if (blocksAllBots(robotsText)) return [...AI_BOTS]
  return blockedAiBots(robotsText)
}

/**
 * Statuts HTTP par lesquels un serveur refuse notre robot plutôt que d'être en
 * panne : 401 et 403 (accès interdit), 429 (trop de requêtes), 451 (raisons
 * légales). Pour un visiteur humain, le site fonctionne parfaitement.
 *
 * La distinction n'est pas cosmétique : sur un refus, le corps renvoyé est une
 * page d'erreur ou un mur anti-bot. Analyser son HTML — titre, meta, H1,
 * données structurées — reviendrait à noter le mur, pas le site. Ces
 * vérifications sont donc écartées du score au lieu d'être comptées en échec.
 */
const ACCESS_DENIED_STATUSES = new Set([401, 403, 429, 451])

export function isAccessDenied(status: number): boolean {
  return ACCESS_DENIED_STATUSES.has(status)
}

/**
 * Vérifications qui lisent le HTML de la page d'accueil. Quand le serveur nous
 * a refusé l'accès, ce HTML est celui d'une page d'erreur : ces checks sont
 * retirés du résultat plutôt que comptés en échec. Mieux vaut ne rien dire que
 * de noter un mur anti-bot.
 */
const HTML_DERIVED_CHECK_KEYS = new Set([
  'title',
  'meta-description',
  'h1',
  'lang',
  'json-ld',
  'open-graph',
])

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
  // 403 sur nytimes.com, 429 sur un site protégé : le site marche pour un
  // humain, c'est notre robot qui est refusé. Deux conséquences — le message
  // doit le dire, et les vérifications HTML ne doivent pas noter la page
  // d'erreur reçue à la place du site.
  const accessDenied = isAccessDenied(home.status)
  const robotsOk = robots !== null && robots.status === 200
  // Pas de robots.txt du tout → rien ne bloque personne (comportement par
  // défaut des crawlers) : seul un robots.txt PRÉSENT peut bloquer.
  const blockedBots = robotsOk ? effectivelyBlockedAiBots(robots.text) : []
  const aiBotsBlocked = blockedBots.length > 0

  const checks: ExpressCheck[] = [
    {
      key: 'reachable',
      label: accessDenied ? 'Accès autorisé à notre robot' : 'Site accessible',
      ok: home.status < 400,
      hint: accessDenied
        ? `Votre site fonctionne, mais il a refusé notre robot (erreur ${home.status}). Un pare-feu ou une protection anti-bot filtre les visiteurs automatiques — et il y a de fortes chances qu'il bloque aussi GPTBot et les robots des autres IA, qui ne pourront donc pas vous citer.`
        : `Votre page d'accueil répond une erreur (${home.status}) — les IA ne peuvent rien lire.`,
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
      ok:
        hasTag(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i) ||
        hasTag(html, /<meta[^>]+content=["'][^"']{10,}["'][^>]+name=["']description["']/i),
      hint: 'Le petit résumé repris par les moteurs et les IA pour vous présenter est absent.',
    },
    {
      key: 'h1',
      label: 'Titre principal (H1)',
      ok: hasTag(html, /<h1[\s>]/i),
      hint: "Le H1 annonce le sujet de la page — les IA s'y fient beaucoup.",
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
      hint: "Vos pages n'ont pas d'aperçu riche quand elles sont partagées ou citées.",
    },
    {
      key: 'robots-present',
      label: 'robots.txt présent',
      ok: robotsOk,
      hint: "Le fichier robots.txt est introuvable — les robots avancent à l'aveugle, sans savoir ce qu'ils ont le droit de lire.",
    },
    {
      key: 'robots-ai-bots',
      label: 'Ouvert aux robots des IA (GPTBot, ClaudeBot, Perplexity…)',
      ok: !aiBotsBlocked,
      // Rédhibitoire : un bot qui ne peut pas lire votre site ne peut pas
      // vous citer, quelle que soit la qualité du reste. D'où le poids fort.
      weight: AI_BOTS_BLOCK_WEIGHT,
      hint: aiBotsBlocked
        ? `Votre robots.txt bloque explicitement : ${blockedBots.join(', ')}. Ces robots ne peuvent pas lire votre site — vous êtes invisible pour eux, volontairement ou non.`
        : 'Les robots des principales IA peuvent lire votre site.',
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
      hint: "La carte de visite de votre site pour les IA n'existe pas (2 minutes à créer).",
    },
  ]

  // Accès refusé : on ne garde que ce qu'on a réellement pu mesurer. Les
  // vérifications HTML porteraient sur la page d'erreur, et les fichiers
  // (robots.txt, sitemap, llms.txt) filtrés par le même pare-feu seraient
  // déclarés « introuvables » alors qu'on n'en sait rien.
  const measurable = accessDenied
    ? checks.filter((c) => {
        if (HTML_DERIVED_CHECK_KEYS.has(c.key)) return false
        if (c.key === 'speed') return false
        if (c.key === 'robots-present' || c.key === 'robots-ai-bots') return robotsOk
        if (c.key === 'sitemap') return sitemap !== null && !isAccessDenied(sitemap.status)
        if (c.key === 'llms-txt') return llms !== null && !isAccessDenied(llms.status)
        return true
      })
    : checks

  const score = computeExpressScore(measurable)

  return {
    domain: target.hostname.replace(/^www\./, ''),
    score,
    checks: measurable,
    responseTimeMs: home.ms,
  }
}
