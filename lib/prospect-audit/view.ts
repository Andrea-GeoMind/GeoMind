/**
 * Mise en forme des données d'un audit prospect pour la page et la feuille A4.
 * Pure : aucune E/S, testée unitairement.
 */

import { formatNumber, formatRating, hasOwnSite, platformLabel, PHOTO_TARGET } from '@/lib/prospect-audit/issues'
import { normalizeName } from '@/lib/prospect-audit/citations'
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABELS,
  type AnswerCell,
  type CompetitorSnapshot,
  type IssueCategory,
  type PlaceSnapshot,
  type ProspectEngine,
  type ProspectIssue,
} from '@/lib/prospect-audit/types'

export function findCell(answers: AnswerCell[], question: number, engine: ProspectEngine): AnswerCell | null {
  return answers.find((a) => a.question === question && a.engine === engine) ?? null
}

/** Acteurs cités à la place du commerce pour une question, tous moteurs confondus. */
export function citedInsteadForQuestion(answers: AnswerCell[], question: number, limit = 3): string[] {
  const counts = new Map<string, { name: string; count: number; first: number }>()
  let order = 0
  for (const a of answers.filter((x) => x.question === question && x.status === 'ok')) {
    for (const name of a.competitors) {
      const key = normalizeName(name)
      const entry = counts.get(key)
      if (entry) entry.count += 1
      else counts.set(key, { name, count: 1, first: order++ })
    }
  }
  return [...counts.values()]
    .sort((x, y) => y.count - x.count || x.first - y.first)
    .slice(0, limit)
    .map((e) => e.name)
}

export interface PresenceSummary {
  cited: number
  answered: number
}

export function presenceSummary(answers: AnswerCell[]): PresenceSummary {
  const ok = answers.filter((a) => a.status === 'ok')
  return { cited: ok.filter((a) => a.cited).length, answered: ok.length }
}

/** « Cité dans 0 réponse sur 15 », « Cité dans 3 réponses sur 15 ». */
export function citedLabel({ cited, answered }: PresenceSummary): string {
  return `Cité dans ${cited} réponse${cited > 1 ? 's' : ''} sur ${answered}`
}

// ─── Fiche Google : comparaison avec le concurrent ────────────────────────────

export interface ComparisonRow {
  label: string
  mine: string
  mineNote: string | null
  theirs: string
  theirsNote: string | null
  /** Le commerce est en retard sur ce point. */
  late: boolean
}

function siteCell(p: PlaceSnapshot): { value: string; note: string | null } {
  if (hasOwnSite(p)) return { value: 'Oui', note: null }
  if (p.website && p.listing) return { value: 'Pas de site', note: `lien ${platformLabel(p.listing)}` }
  return { value: 'Pas de site', note: null }
}

function photosCell(n: number): string {
  return n >= PHOTO_TARGET ? `${PHOTO_TARGET}+` : String(n)
}

export function comparisonRows(p: PlaceSnapshot, c: CompetitorSnapshot): ComparisonRow[] {
  const mySite = siteCell(p)
  const theirSite = siteCell(c)
  return [
    {
      label: 'Note',
      mine: p.rating === null ? '—' : formatRating(p.rating),
      mineNote: null,
      theirs: c.rating === null ? '—' : formatRating(c.rating),
      theirsNote: null,
      late: p.rating !== null && c.rating !== null && c.rating - p.rating >= 0.3 - 1e-9,
    },
    {
      label: "Nombre d'avis",
      mine: formatNumber(p.reviewCount),
      mineNote: null,
      theirs: formatNumber(c.reviewCount),
      theirsNote: null,
      late: p.reviewCount < c.reviewCount,
    },
    {
      label: 'Photos',
      mine: photosCell(p.photoCount),
      mineNote: null,
      theirs: photosCell(c.photoCount),
      theirsNote: null,
      late: p.photoCount < c.photoCount,
    },
    {
      label: 'Horaires renseignés',
      mine: p.hasHours ? 'Oui' : 'Non',
      mineNote: null,
      theirs: c.hasHours ? 'Oui' : 'Non',
      theirsNote: null,
      late: c.hasHours && !p.hasHours,
    },
    {
      label: 'Site web',
      mine: mySite.value,
      mineNote: mySite.note,
      theirs: theirSite.value,
      theirsNote: theirSite.note,
      late: hasOwnSite(c) && !hasOwnSite(p),
    },
  ]
}

// ─── Problèmes ────────────────────────────────────────────────────────────────

export interface IssueGroup {
  category: IssueCategory
  label: string
  issues: ProspectIssue[]
}

export function groupIssues(issues: ProspectIssue[]): IssueGroup[] {
  return ISSUE_CATEGORIES.map((category) => ({
    category,
    label: ISSUE_CATEGORY_LABELS[category],
    issues: issues.filter((i) => i.category === category),
  })).filter((g) => g.issues.length > 0)
}

export function issueCountLabel(n: number): string {
  return n === 0
    ? 'Aucun problème détecté sur votre présence en ligne'
    : `${n} problème${n > 1 ? 's' : ''} détecté${n > 1 ? 's' : ''} sur votre présence en ligne`
}

/** Libellé court du nom pour les en-têtes : « ATLAS Training - Coaching… » → « ATLAS Training ». */
export function shortBusinessName(name: string): string {
  const core = name.split(/\s[-|–—]\s|\s\|\s?/)[0]?.trim() ?? name
  return core.length >= 3 ? core : name
}

export function scoreLabel(score: number | null): string {
  return score === null ? '—' : String(score)
}

