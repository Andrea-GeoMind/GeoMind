/**
 * lib/analysis/pixel.ts
 *
 * Pixel GeoMind (PLAN item 29) — partie PURE : détection de la source IA depuis
 * le referrer, et agrégation des événements pour le dashboard. Aucun accès DB,
 * aucun effet de bord — testable unitairement.
 */

export type AiSource = 'chatgpt' | 'perplexity' | 'gemini' | 'copilot' | 'claude' | 'other'

export const AI_SOURCE_LABELS: Record<AiSource, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Google Gemini / AI',
  copilot: 'Microsoft Copilot',
  claude: 'Claude',
  other: 'Autre IA',
}

// Domaines (et fragments) de referrer par moteur. Ordre = priorité de test.
const SOURCE_PATTERNS: { source: AiSource; test: RegExp }[] = [
  { source: 'chatgpt', test: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/ },
  { source: 'perplexity', test: /(^|\.)perplexity\.ai$/ },
  { source: 'claude', test: /(^|\.)claude\.ai$|(^|\.)anthropic\.com$/ },
  { source: 'copilot', test: /(^|\.)copilot\.microsoft\.com$|(^|\.)bing\.com\/chat/ },
  // Gemini : domaine dédié. (On NE classe PAS google.com en IA — trop large,
  // ce serait du SEO classique, pas une réponse générative.)
  { source: 'gemini', test: /(^|\.)gemini\.google\.com$/ },
]

/**
 * Détermine la source IA d'un referrer. Retourne null si le referrer n'est PAS
 * une IA (trafic classique) — l'événement n'est alors pas un événement « IA ».
 */
export function detectAiSource(referrer: string | null | undefined): AiSource | null {
  if (!referrer) return null
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  // On teste aussi le referrer complet pour bing.com/chat
  const full = `${host}${(() => {
    try {
      return new URL(referrer).pathname
    } catch {
      return ''
    }
  })()}`
  for (const { source, test } of SOURCE_PATTERNS) {
    if (test.test(host) || test.test(full)) return source
  }
  return null
}

export type ActionKind = 'tel' | 'mailto' | 'form' | 'booking' | 'outbound'

const ACTION_KINDS: ActionKind[] = ['tel', 'mailto', 'form', 'booking', 'outbound']

export function isValidActionKind(v: unknown): v is ActionKind {
  return typeof v === 'string' && (ACTION_KINDS as string[]).includes(v)
}

// ─── Agrégation pour le dashboard ──────────────────────────────────────────────

export interface PixelEventLite {
  type: 'pageview' | 'action'
  aiSource: string
  actionKind: string | null
  visitorHash: string
  createdAt: Date
}

export interface PixelSummary {
  /** Visiteurs uniques venus d'une IA (hash distincts) */
  aiVisitors: number
  /** Pages vues venant d'une IA */
  aiPageviews: number
  /** Actions réalisées par des visiteurs venus d'une IA */
  aiActions: number
  /** Répartition des visiteurs par source IA */
  bySource: { source: AiSource; label: string; visitors: number; pageviews: number }[]
  /** Répartition des actions par type */
  byAction: { kind: ActionKind; count: number }[]
}

const ACTION_LABELS: Record<ActionKind, string> = {
  tel: 'Appels (clic téléphone)',
  mailto: 'Emails (clic adresse)',
  form: 'Formulaires envoyés',
  booking: 'Prises de rendez-vous',
  outbound: 'Clics sortants',
}

export function actionLabel(kind: ActionKind): string {
  return ACTION_LABELS[kind]
}

function asSource(s: string): AiSource {
  return (Object.keys(AI_SOURCE_LABELS) as AiSource[]).includes(s as AiSource)
    ? (s as AiSource)
    : 'other'
}

/** Agrège une liste d'événements en synthèse pour le dashboard. */
export function summarizePixelEvents(events: PixelEventLite[]): PixelSummary {
  const visitorsBySource = new Map<AiSource, Set<string>>()
  const pageviewsBySource = new Map<AiSource, number>()
  const actionCounts = new Map<ActionKind, number>()
  const allVisitors = new Set<string>()
  let aiPageviews = 0
  let aiActions = 0

  for (const e of events) {
    const source = asSource(e.aiSource)
    allVisitors.add(e.visitorHash)
    if (!visitorsBySource.has(source)) visitorsBySource.set(source, new Set())
    visitorsBySource.get(source)!.add(e.visitorHash)

    if (e.type === 'pageview') {
      aiPageviews += 1
      pageviewsBySource.set(source, (pageviewsBySource.get(source) ?? 0) + 1)
    } else if (e.type === 'action') {
      aiActions += 1
      if (isValidActionKind(e.actionKind)) {
        actionCounts.set(e.actionKind, (actionCounts.get(e.actionKind) ?? 0) + 1)
      }
    }
  }

  const bySource = [...visitorsBySource.entries()]
    .map(([source, set]) => ({
      source,
      label: AI_SOURCE_LABELS[source],
      visitors: set.size,
      pageviews: pageviewsBySource.get(source) ?? 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)

  const byAction = [...actionCounts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)

  return {
    aiVisitors: allVisitors.size,
    aiPageviews,
    aiActions,
    bySource,
    byAction,
  }
}
