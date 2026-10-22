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
  type AuditDocument,
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


// ─── Feuille A4 : présence, concurrents, le plus urgent ───────────────────────

/** « 0 / 15 » : jamais un chiffre seul pour la présence dans les IA. */
export function presenceFraction({ cited, answered }: PresenceSummary): string {
  return `${cited} / ${answered}`
}

/** Les acteurs les plus cités à la place du commerce, dans les réponses obtenues. */
export function topCitedInstead(doc: Pick<AuditDocument, 'citedInstead'>, limit = 3): string[] {
  return doc.citedInstead.slice(0, limit).map((c) => {
    const short = shortBusinessName(c.name)
    return short.length > 40 ? `${short.slice(0, 39).trimEnd()}…` : short
  })
}

/**
 * Le problème le plus grave, en une phrase sans jargon. Ordre de gravité fixe :
 * ce qui empêche d'être lu du tout (noindex, robots, pas de site), puis la
 * fiche Google, puis l'absence dans les IA. Pure et déterministe.
 */
export function mostUrgent(doc: Pick<AuditDocument, 'issues' | 'prospect' | 'answers'>): string | null {
  const keys = new Set(doc.issues.map((i) => i.key))
  const p = doc.prospect
  const rules: [string, () => string][] = [
    ['technique.noindex_on_key_pages', () => "votre site demande à Google de ne pas l'afficher."],
    ['technique.robots_txt_block_all', () => 'votre site interdit aux moteurs de recherche de le lire.'],
    ['technique.robots_txt_block_ai_bots', () => 'votre site interdit aux IA de le lire.'],
    ['site.inaccessible', () => "votre site n'a pas pu être lu : les IA risquent de ne pas pouvoir le lire non plus."],
    ['site.absent', () => "vous n'avez pas de site : les IA n'ont rien à lire sur vous."],
    [
      'site.plateforme',
      () => `vous n'avez pas de site à vous : votre fiche renvoie vers ${p.listing ? platformLabel(p.listing) : 'une plateforme'}, les IA n'ont rien à lire sur vous.`,
    ],
    ['technique.https_missing', () => "votre site n'est pas sécurisé (pas de cadenas dans le navigateur)."],
    ['technique.mobile_viewport_missing', () => "votre site s'affiche mal sur téléphone."],
    ['fiche.horaires', () => "vos horaires n'apparaissent pas sur votre fiche Google."],
    [
      'avis.nombre',
      () =>
        `vous avez ${formatNumber(p.reviewCount)} avis Google, quand la médiane du quartier est de ${formatNumber(p.sectorMedianReviews)}.`,
    ],
    [
      'avis.note',
      () =>
        `votre note Google (${p.rating === null ? '—' : formatRating(p.rating)}) est en dessous de celle de ${p.competitor?.name ?? 'votre concurrent le plus proche'}.`,
    ],
    ['photos.nombre', () => `votre fiche Google ne montre que ${p.photoCount} photo${p.photoCount > 1 ? 's' : ''}.`],
  ]
  for (const [key, sentence] of rules) if (keys.has(key)) return sentence()
  if ([...keys].some((k) => k.startsWith('ia.'))) {
    const { cited } = presenceSummary(doc.answers)
    return cited === 0 ? 'aucune IA ne vous cite quand un client demande conseil.' : 'les IA vous citent rarement.'
  }
  const first = doc.issues[0]
  return first ? `${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}.` : null
}
