/**
 * Détection du commerce dans une réponse d'IA — pure et déterministe.
 *
 * Un commerce de quartier n'a souvent pas de site : la citation par domaine,
 * qui suffit à l'analyse classique, ne le verrait jamais. On cherche donc
 * aussi son NOM, avec deux précautions contre les faux positifs :
 *  - un nom générique (« Le Barbier », « Salon Jennifer » moins le prénom…)
 *    n'est reconnu que s'il est le nom d'un acteur de la liste, pas au détour
 *    d'une phrase (« le barbier idéal ») ;
 *  - un nom distinctif (« ATLAS Training ») est reconnu partout dans le texte.
 * Le lien de plateforme de la fiche (page Planity, compte Instagram) compte
 * aussi : c'est l'adresse exacte du commerce.
 */

import type { IASource } from '@/lib/ai/connectors/base'

/** Mots qui ne distinguent pas un commerce d'un autre du même secteur. */
const GENERIC_WORDS = new Set([
  'le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'et', 'a', 'au', 'aux', 'en', 'by', 'the', 'and',
  'lyon', 'paris', 'salon', 'studio', 'atelier', 'maison', 'espace', 'institut',
  'barbier', 'barbiers', 'barber', 'barbershop', 'barbers', 'shop',
  'coiffeur', 'coiffeurs', 'coiffeuse', 'coiffure', 'coiffures', 'hair', 'beaute',
  'coaching', 'coach', 'sportif', 'sport', 'sports', 'fitness', 'training', 'gym', 'salle', 'club',
  'yoga', 'pilates', 'boxe', 'crossfit',
])

export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Partie avant « - », « | », « – » : « ATLAS Training - Coaching sportif à Lyon » → « ATLAS Training ». */
function coreName(name: string): string {
  return name.split(/\s[-|–—]\s|\s\|\s?|\|/)[0] ?? name
}

export interface TargetBusiness {
  name: string
  /** Domaine d'un site à soi (sans www), null sinon. */
  domain: string | null
  /** Lien de plateforme de la fiche (Planity, Instagram…), null sinon. */
  listingUrl: string | null
}

export interface NameMatcher {
  /** Formes normalisées du nom (complet, puis cœur). */
  variants: string[]
  /** Le nom a au moins un mot distinctif : reconnaissable partout dans le texte. */
  distinctive: boolean
}

export function buildNameMatcher(name: string): NameMatcher {
  const variants = [...new Set([normalizeName(name), normalizeName(coreName(name))])].filter(
    (v) => v.replace(/ /g, '').length >= 3
  )
  const core = normalizeName(coreName(name))
  const distinctiveWords = core.split(' ').filter((w) => w.length >= 3 && !GENERIC_WORDS.has(w))
  return { variants, distinctive: distinctiveWords.join('').length >= 4 }
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${phrase} `)
}

/** L'acteur de la liste est-il le commerce ? */
export function actorMatches(actor: string, matcher: NameMatcher): boolean {
  const a = normalizeName(actor)
  if (!a) return false
  return matcher.variants.some((v) => a === v || a.startsWith(`${v} `) || (matcher.distinctive && containsPhrase(a, v)))
}

// ─── Extraction des acteurs listés ────────────────────────────────────────────

const NUMBERED = /^ {0,3}(?:#{1,4}\s*)?\d{1,2}[.)]\s+(.+)$/
const BULLET = /^ {0,1}[-*•]\s+(.+)$/
const HEADING = /^#{2,4}\s+(.+)$/

/** Libellés de détail, jamais des noms d'acteurs. */
const DETAIL_LABEL =
  /^(adresse|site|site web|web|url|tarifs?|prix|note|avis|horaires?|t[ée]l[ée]phone|contact|sp[ée]cialit[ée]s?|points? forts?|pourquoi|services?|prestations?|localisation|acc[eè]s|instagram|facebook|r[ée]servation|ambiance|offre|id[ée]al|parfait)\b/i

function cleanActorName(raw: string): string | null {
  let s = raw.trim()
  // Gras en tête : le nom est presque toujours là
  const bold = /^\*\*(.+?)\*\*|^__(.+?)__/.exec(s)
  if (bold) s = (bold[1] ?? bold[2] ?? '').trim()
  // Lien markdown : on garde l'intitulé
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/[*_`]/g, '')
  // Coupe au premier séparateur de description
  s = s.split(/\s[–—-]\s|\s?:\s|\s\(|\s\|\s|, situ|, au |, rue /)[0] ?? s
  s = s.replace(/^(?:\d{1,2}[.)]\s*)/, '').replace(/[.:;,!?\s]+$/, '').trim()
  if (s.length < 2 || s.length > 70) return null
  if (DETAIL_LABEL.test(s)) return null
  if (/^https?:\/\//i.test(s)) return null
  return s
}

/**
 * Acteurs nommés par la réponse, dans l'ordre et sans doublon. Les éléments
 * numérotés priment : une puce indentée sous un numéro est un détail
 * (adresse, tarif), pas un concurrent.
 */
export function extractListedActors(answer: string): string[] {
  const lines = answer.split(/\r?\n/)
  const numbered: string[] = []
  const bullets: string[] = []
  const headings: string[] = []
  for (const line of lines) {
    const n = NUMBERED.exec(line)
    if (n?.[1]) {
      numbered.push(n[1])
      continue
    }
    const h = HEADING.exec(line)
    if (h?.[1]) {
      headings.push(h[1])
      continue
    }
    const b = BULLET.exec(line)
    if (b?.[1]) bullets.push(b[1])
  }
  const pool = numbered.length > 0 ? numbered : bullets.length > 0 ? bullets : headings
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of pool) {
    const name = cleanActorName(raw)
    if (!name) continue
    const key = normalizeName(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

// ─── Analyse d'une réponse ────────────────────────────────────────────────────

export interface AnswerAnalysis {
  cited: boolean
  position: number | null
  competitors: string[]
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

/** « https://www.planity.com/le-barbier-69001-lyon » → « planity.com/le-barbier-69001-lyon ». */
function listingKey(url: string): string | null {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, '').toLowerCase()
    if (!path || path === '/') return null
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${path}`
  } catch {
    return null
  }
}

function mentionsDomain(domain: string, answer: string, sources: IASource[]): boolean {
  if (sources.some((s) => s.domain.replace(/^www\./, '').toLowerCase() === domain)) return true
  if (sources.some((s) => hostOf(s.url) === domain)) return true
  const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9-])${escaped}($|[^a-z0-9-])`, 'i').test(answer)
}

function mentionsListing(key: string, answer: string, sources: IASource[]): boolean {
  const lower = answer.toLowerCase()
  if (lower.includes(key)) return true
  return sources.some((s) => listingKey(s.url) === key)
}

export function analyseAnswer(
  answer: string,
  sources: IASource[],
  target: TargetBusiness,
  maxCompetitors = 10
): AnswerAnalysis {
  const matcher = buildNameMatcher(target.name)
  const actors = extractListedActors(answer)
  const index = actors.findIndex((a) => actorMatches(a, matcher))

  let cited = index >= 0
  if (!cited && matcher.distinctive) {
    const text = normalizeName(answer)
    cited = matcher.variants.some((v) => containsPhrase(text, v))
  }
  if (!cited && target.domain) cited = mentionsDomain(target.domain, answer, sources)
  if (!cited && target.listingUrl) {
    const key = listingKey(target.listingUrl)
    if (key) cited = mentionsListing(key, answer, sources)
  }

  const competitors = actors.filter((_, i) => i !== index).slice(0, maxCompetitors)
  return { cited, position: index >= 0 ? index + 1 : null, competitors }
}

/**
 * Acteurs les plus souvent cités à la place du commerce : comptés une fois par
 * réponse, regroupés par nom normalisé, le libellé le plus fréquent gardé.
 */
export function rankCitedInstead(
  answers: { competitors: string[] }[],
  limit = 8
): { name: string; answers: number }[] {
  const byKey = new Map<string, { count: number; labels: Map<string, number> }>()
  for (const a of answers) {
    const keys = new Set<string>()
    for (const name of a.competitors) {
      const key = normalizeName(name)
      if (!key || keys.has(key)) continue
      keys.add(key)
      const entry = byKey.get(key) ?? { count: 0, labels: new Map() }
      entry.count += 1
      entry.labels.set(name, (entry.labels.get(name) ?? 0) + 1)
      byKey.set(key, entry)
    }
  }
  return [...byKey.values()]
    .map((e) => ({
      name: [...e.labels.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]![0],
      answers: e.count,
    }))
    .sort((x, y) => y.answers - x.answers || x.name.localeCompare(y.name))
    .slice(0, limit)
}
