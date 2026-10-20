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

/**
 * Notes de l'audit. Autorité = part des réponses obtenues qui citent le
 * commerce (même formule que l'analyse). Sans site, Technique et Contenu ne
 * sont pas mesurées (null) et la note globale est la moyenne des notes
 * mesurées — la page le dit. Pure : mêmes entrées, mêmes notes.
 */
export function computeProspectScores(
  answers: AnswerCell[],
  technical: number | null,
  content: number | null
): ProspectScores | null {
  const ok = answers.filter((a) => a.status === 'ok')
  const authority = computeAuthorityScore(ok.length, ok.filter((a) => a.cited).length)
  if (authority === null) return null
  const measured = [authority, technical, content].filter((s): s is number => s !== null)
  const round = (n: number) => Math.round(Math.max(0, Math.min(100, n)))
  return {
    global: round(measured.reduce((a, b) => a + b, 0) / measured.length),
    authority: round(authority),
    technical: technical === null ? null : round(technical),
    content: content === null ? null : round(content),
  }
}
