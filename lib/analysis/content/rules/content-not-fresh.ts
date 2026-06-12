import type { RuleInput, ContentIssue } from '../types'

/** Fenêtre de fraîcheur : une date de moins de 12 mois rend le site "frais". */
const FRESHNESS_WINDOW_MS = 365 * 24 * 60 * 60 * 1000

const MONTHS_FR: Record<string, number> = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
}

const MONTH_YEAR_PATTERN =
  /\b(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b/gi
const DMY_PATTERN = /\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/g
const ISO_PATTERN = /\b(20\d{2})-(\d{2})-(\d{2})\b/g
const YEAR_PATTERN = /\b(20\d{2})\b/g

/** Extrait toutes les dates détectables d'un markdown (déterministe). */
function extractDates(markdown: string): Date[] {
  const dates: Date[] = []

  for (const m of markdown.matchAll(ISO_PATTERN)) {
    dates.push(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  }
  for (const m of markdown.matchAll(DMY_PATTERN)) {
    // Format français jj/mm/aaaa
    dates.push(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])))
  }
  for (const m of markdown.matchAll(MONTH_YEAR_PATTERN)) {
    const month = MONTHS_FR[m[1].toLowerCase()]
    if (month !== undefined) dates.push(new Date(Number(m[2]), month, 1))
  }
  for (const m of markdown.matchAll(YEAR_PATTERN)) {
    // Année seule : on la situe au 1er janvier (heuristique conservatrice)
    dates.push(new Date(Number(m[1]), 0, 1))
  }

  return dates.filter((d) => !Number.isNaN(d.getTime()))
}

/**
 * Variante pure et testable : `now` est injecté pour le déterminisme.
 * Une date est "fraîche" si elle date de moins de 12 mois (les dates futures
 * proches comptent aussi, ex. une année en cours mentionnée en janvier).
 */
export async function checkContentNotFreshAt(
  { pages }: RuleInput,
  now: Date
): Promise<ContentIssue | null> {
  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const threshold = now.getTime() - FRESHNESS_WINDOW_MS
  const hasFreshDate = contentPages.some((p) =>
    extractDates(p.markdown ?? '').some((d) => d.getTime() >= threshold)
  )
  if (hasFreshDate) return null

  return {
    ruleKey: 'content_not_fresh',
    category: 'coverage',
    title: 'Contenu sans signe de fraîcheur',
    description: `Aucune date de moins de 12 mois n'a été détectée dans vos contenus. Les IA privilégient les informations récentes : mettez à jour vos pages clés et affichez une date de mise à jour visible pour signaler que votre contenu est actuel.`,
    sampleUrls: contentPages.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}

/**
 * Règle SITE — aucun contenu daté de moins de 12 mois.
 */
export async function checkContentNotFresh(input: RuleInput): Promise<ContentIssue | null> {
  return checkContentNotFreshAt(input, new Date())
}
