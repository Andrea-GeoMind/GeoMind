/**
 * Problèmes d'un audit prospect — règles déterministes, aucun appel LLM.
 *
 * Chaque problème découle d'un fait relevé : la fiche Google (API Places),
 * les règles Technique et Contenu de l'analyse (sur le site, s'il existe), et
 * les réponses des IA. Rien n'est estimé ni inventé : sans fait, pas de
 * problème. Les règles de page déclenchées sur plusieurs pages ne comptent
 * qu'une fois.
 */

import type { TechnicalIssue } from '@/lib/analysis/technical/types'
import type { ContentIssue } from '@/lib/analysis/content/types'
import { computeAuthorityScore } from '@/lib/analysis/scoring'
import {
  ENGINE_LABELS,
  ISSUE_CATEGORIES,
  PROSPECT_ENGINES,
  type AnswerCell,
  type PlaceSnapshot,
  type ProspectActivity,
  type ProspectInput,
  type ProspectIssue,
  type ProspectScores,
} from '@/lib/prospect-audit/types'

/** Plafond de l'API Places : au-delà, elle répond 10. */
export const PHOTO_TARGET = 10
/** Écart de note à partir duquel il se voit sur la fiche. */
const RATING_GAP = 0.3

const PLATFORM_LABELS: Record<string, string> = {
  'planity.com': 'Planity',
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'treatwell.fr': 'Treatwell',
}

const ACTIVITY_PLURAL: Record<ProspectActivity, string> = {
  barbier: 'barbiers',
  coiffeur: 'coiffeurs',
  'coach sportif': 'coachs et salles de sport',
  'salle de sport': 'salles de sport',
  'studio de yoga': 'studios de yoga',
  'salle de boxe': 'salles de boxe',
}

export function platformLabel(listing: string): string {
  return PLATFORM_LABELS[listing] ?? listing
}

/** Le lien de la fiche mène à un site à soi (pas une plateforme). */
export function hasOwnSite(p: { website: string | null; listing: string | null }): boolean {
  return Boolean(p.website) && !p.listing
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')
}

export function formatRating(r: number): string {
  return `${r.toFixed(1).replace('.', ',')} / 5`
}

function arrondissementShort(arr: string): string {
  return arr.replace(/^Lyon\s+/i, '')
}

// ─── Fiche Google, avis, photos, site ─────────────────────────────────────────

export function placeIssues(p: ProspectInput): ProspectIssue[] {
  const out: ProspectIssue[] = []
  const c = p.competitor
  const compAt = c ? `${c.name}, à ${formatNumber(c.distanceM)} m,` : null

  if (!p.hasHours) {
    out.push({
      key: 'fiche.horaires',
      category: 'fiche',
      title: 'Horaires absents de la fiche Google',
      detail: c?.hasHours
        ? `Vos horaires d'ouverture n'y figurent pas ; ${c.name} affiche les siens.`
        : "Vos horaires d'ouverture n'y figurent pas.",
    })
  }

  const belowMedian = p.reviewCount < p.sectorMedianReviews
  const belowCompetitor = c !== null && p.reviewCount < c.reviewCount
  if (belowMedian || belowCompetitor) {
    const parts: string[] = []
    if (belowMedian) {
      parts.push(
        `la médiane des ${ACTIVITY_PLURAL[p.activity]} du ${arrondissementShort(p.arrondissement)} est de ${formatNumber(p.sectorMedianReviews)}`
      )
    }
    if (belowCompetitor && c) parts.push(`${compAt} en a ${formatNumber(c.reviewCount)}`)
    out.push({
      key: 'avis.nombre',
      category: 'avis',
      title: `${formatNumber(p.reviewCount)} avis Google seulement`,
      detail: `${parts.join(' ; ')}.`.replace(/^./, (ch) => ch.toUpperCase()),
    })
  }

  if (p.rating !== null && c?.rating != null && c.rating - p.rating >= RATING_GAP - 1e-9) {
    out.push({
      key: 'avis.note',
      category: 'avis',
      title: `Note de ${formatRating(p.rating)}`,
      detail: `${compAt} est noté ${formatRating(c.rating)}.`,
    })
  }

  if (p.photoCount < PHOTO_TARGET) {
    out.push({
      key: 'photos.nombre',
      category: 'photos',
      title:
        p.photoCount === 0
          ? 'Aucune photo sur la fiche Google'
          : `${p.photoCount} photo${p.photoCount > 1 ? 's' : ''} seulement sur la fiche Google`,
      detail:
        c && c.photoCount >= PHOTO_TARGET
          ? `${c.name} en montre au moins ${PHOTO_TARGET}.`
          : `Une fiche complète en montre au moins ${PHOTO_TARGET}.`,
    })
  }

  if (!p.website) {
    out.push({
      key: 'site.absent',
      category: 'site',
      title: 'Pas de site web',
      detail: "Votre fiche Google ne renvoie vers aucun site : les IA n'ont aucune page à vous à lire.",
    })
  } else if (p.listing) {
    out.push({
      key: 'site.plateforme',
      category: 'site',
      title: 'Pas de site à vous',
      detail: `Votre fiche renvoie vers votre page ${platformLabel(p.listing)}, pas vers un site à votre nom.`,
    })
  }

  return out
}

// ─── Technique et contenu (règles existantes de l'analyse) ────────────────────

type RuleIssue = Pick<TechnicalIssue | ContentIssue, 'ruleKey' | 'title' | 'description' | 'pageUrl'>

/** Première phrase, bornée : la description d'une règle peut être longue. */
function firstSentence(text: string, max = 220): string {
  const s = text.replace(/\s+/g, ' ').trim()
  const cut = /^(.+?[.!?])(\s|$)/.exec(s)?.[1] ?? s
  return cut.length > max ? `${cut.slice(0, max - 1).trimEnd()}…` : cut
}

export function ruleIssues(
  category: 'technique' | 'contenu',
  issues: RuleIssue[],
  pagesAnalysed: number
): ProspectIssue[] {
  const byRule = new Map<string, { issue: RuleIssue; pages: number }>()
  for (const issue of issues) {
    const entry = byRule.get(issue.ruleKey)
    if (entry) entry.pages += issue.pageUrl ? 1 : 0
    else byRule.set(issue.ruleKey, { issue, pages: issue.pageUrl ? 1 : 0 })
  }
  return [...byRule.values()].map(({ issue, pages }) => {
    const scope = pages > 0 && pagesAnalysed > 1 ? ` (${pages} page${pages > 1 ? 's' : ''} sur ${pagesAnalysed})` : ''
    return {
      key: `${category}.${issue.ruleKey}`,
      category,
      title: `${issue.title}${scope}`,
      detail: firstSentence(issue.description),
    }
  })
}

export function siteUnreachableIssue(url: string): ProspectIssue {
  return {
    key: 'site.inaccessible',
    category: 'site',
    title: "Site inaccessible pendant l'audit",
    detail: `Aucune page de ${url} n'a pu être lue : les IA risquent de ne pas pouvoir la lire non plus.`,
  }
}

// ─── Présence dans les IA ─────────────────────────────────────────────────────

export function aiIssues(answers: AnswerCell[]): ProspectIssue[] {
  const out: ProspectIssue[] = []
  for (const engine of PROSPECT_ENGINES) {
    const ok = answers.filter((a) => a.engine === engine && a.status === 'ok')
    if (ok.length === 0) continue
    const cited = ok.filter((a) => a.cited).length
    if (cited === ok.length) continue
    const label = ENGINE_LABELS[engine]
    out.push({
      key: `ia.${engine}`,
      category: 'ia',
      title: cited === 0 ? `Absent des réponses de ${label}` : `Absent de ${ok.length - cited} réponses sur ${ok.length} de ${label}`,
      detail:
        cited === 0
          ? `Aucune des ${ok.length} questions posées à ${label} ne fait apparaître votre commerce.`
          : `${label} vous cite dans ${cited} réponse${cited > 1 ? 's' : ''} sur ${ok.length}.`,
    })
  }
  return out
}

/** Problèmes triés par catégorie (ordre de la page), ordre interne conservé. */
export function sortIssues(issues: ProspectIssue[]): ProspectIssue[] {
  const rank = new Map(ISSUE_CATEGORIES.map((c, i) => [c, i]))
  return issues
    .map((issue, i) => ({ issue, i }))
    .sort((a, b) => rank.get(a.issue.category)! - rank.get(b.issue.category)! || a.i - b.i)
    .map(({ issue }) => issue)
}

// ─── Notes ────────────────────────────────────────────────────────────────────

/** Barème de la note Fiche Google, sur 100. */
export const PLACE_SCORE_POINTS = { reviews: 30, photos: 20, hours: 15, site: 15, rating: 20 } as const
/** Un lien de plateforme (Planity, Instagram…) vaut une partie des points du site. */
const PLATFORM_LINK_POINTS = 5
/** La note Google rapporte 0 point à 3/5 et tous ses points à 5/5. */
const RATING_FLOOR = 3

export interface PlaceScoreLine {
  key: keyof typeof PLACE_SCORE_POINTS
  label: string
  points: number
  max: number
  detail: string
}

function roundHalf(n: number): number {
  return Math.round(n * 10) / 10
}

/** Détail de la note Fiche Google, critère par critère. Pure. */
export function placeScoreBreakdown(p: PlaceSnapshot & { sectorMedianReviews: number }): PlaceScoreLine[] {
  const P = PLACE_SCORE_POINTS
  const reviewRatio = p.sectorMedianReviews > 0 ? Math.min(1, p.reviewCount / p.sectorMedianReviews) : 1
  const ratingRatio = p.rating === null ? 0 : Math.max(0, Math.min(1, (p.rating - RATING_FLOOR) / (5 - RATING_FLOOR)))
  const site = hasOwnSite(p) ? P.site : p.website ? PLATFORM_LINK_POINTS : 0
  return [
    {
      key: 'reviews',
      label: 'Avis face à la médiane du quartier',
      points: roundHalf(P.reviews * reviewRatio),
      max: P.reviews,
      detail: `${formatNumber(p.reviewCount)} avis, médiane ${formatNumber(p.sectorMedianReviews)}`,
    },
    {
      key: 'photos',
      label: 'Photos',
      points: roundHalf((P.photos * Math.min(PHOTO_TARGET, p.photoCount)) / PHOTO_TARGET),
      max: P.photos,
      detail: p.photoCount >= PHOTO_TARGET ? `${PHOTO_TARGET} ou plus` : `${p.photoCount} sur ${PHOTO_TARGET}`,
    },
    {
      key: 'hours',
      label: 'Horaires renseignés',
      points: p.hasHours ? P.hours : 0,
      max: P.hours,
      detail: p.hasHours ? 'oui' : 'non',
    },
    {
      key: 'site',
      label: 'Site renseigné',
      points: site,
      max: P.site,
      detail: hasOwnSite(p) ? 'site à vous' : p.listing ? `lien ${platformLabel(p.listing)}` : 'aucun',
    },
    {
      key: 'rating',
      label: 'Note Google',
      points: roundHalf(P.rating * ratingRatio),
      max: P.rating,
      detail: p.rating === null ? 'aucune' : formatRating(p.rating),
    },
  ]
}

export function computePlaceScore(p: PlaceSnapshot & { sectorMedianReviews: number }): number {
  const total = placeScoreBreakdown(p).reduce((sum, l) => sum + l.points, 0)
  return Math.round(Math.max(0, Math.min(100, total)))
}

/**
 * Notes de l'audit. Présence IA = part des réponses obtenues qui citent le
 * commerce (même formule que l'analyse). Fiche Google = barème ci-dessus.
 * Sans site à soi, Technique et Contenu ne sont pas mesurées et il n'y a PAS
 * de note globale (null) : une moyenne sans le site comparerait mal deux
 * commerces. Avec un site, globale = moyenne des piliers mesurés. Pure.
 */
export function computeProspectScores(
  answers: AnswerCell[],
  technical: number | null,
  content: number | null,
  prospect: PlaceSnapshot & { sectorMedianReviews: number }
): ProspectScores | null {
  const ok = answers.filter((a) => a.status === 'ok')
  const authority = computeAuthorityScore(ok.length, ok.filter((a) => a.cited).length)
  if (authority === null) return null
  const place = computePlaceScore(prospect)
  const round = (n: number) => Math.round(Math.max(0, Math.min(100, n)))
  const measured = [authority, place, technical, content].filter((s): s is number => s !== null)
  return {
    global: hasOwnSite(prospect) ? round(measured.reduce((a, b) => a + b, 0) / measured.length) : null,
    authority: round(authority),
    place,
    technical: technical === null ? null : round(technical),
    content: content === null ? null : round(content),
  }
}
