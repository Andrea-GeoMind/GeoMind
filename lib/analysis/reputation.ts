/**
 * lib/analysis/reputation.ts
 *
 * Analyse de réputation (PLAN item 31). Partie PURE : agrégation du sentiment,
 * et détection des désaccords factuels entre moteurs — signal d'hallucination
 * (deux IA qui affirment des horaires/adresses différents = au moins une se
 * trompe). L'orchestrateur (impur, appelle les connecteurs via callStructured)
 * est en bas et n'est invoqué que depuis Inngest.
 */

import type { IAEngineName } from '@/lib/ai/connectors/base'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'unknown'
export type ClaimType =
  | 'activite'
  | 'adresse'
  | 'ville'
  | 'horaires'
  | 'telephone'
  | 'prix'
  | 'service'
  | 'fondation'
  | 'autre'

export interface ReputationResultLite {
  engine: IAEngineName
  sentiment: Sentiment
  knowsBusiness: boolean
  claims: { type: string; value: string }[]
}

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  activite: 'Activité',
  adresse: 'Adresse',
  ville: 'Ville',
  horaires: 'Horaires',
  telephone: 'Téléphone',
  prix: 'Prix',
  service: 'Service',
  fondation: 'Création',
  autre: 'Autre',
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: 'Positif',
  neutral: 'Neutre',
  negative: 'Négatif',
  unknown: 'Inconnu',
}

/** Normalise une valeur d'affirmation pour comparaison (minuscule, espaces, ponctuation). */
export function normalizeClaimValue(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export interface ClaimDisagreement {
  type: ClaimType
  label: string
  /** Valeurs distinctes affirmées, avec les moteurs qui les soutiennent */
  variants: { value: string; engines: IAEngineName[] }[]
}

export interface ReputationSummary {
  /** Moteurs qui connaissent l'entreprise */
  knownByEngines: IAEngineName[]
  /** Sentiment dominant (majoritaire parmi les moteurs qui connaissent) */
  overallSentiment: Sentiment
  /** Désaccords factuels = hallucinations probables (≥2 valeurs distinctes pour un même type) */
  disagreements: ClaimDisagreement[]
  /** Toutes les affirmations regroupées par type (pour l'affichage/validation) */
  claimsByType: { type: ClaimType; label: string; values: { value: string; engines: IAEngineName[] }[] }[]
}

function isClaimType(t: string): t is ClaimType {
  return t in CLAIM_TYPE_LABELS
}

export function summarizeReputation(results: ReputationResultLite[]): ReputationSummary {
  const known = results.filter((r) => r.knowsBusiness)
  const knownByEngines = known.map((r) => r.engine)

  // Sentiment dominant parmi ceux qui connaissent
  const counts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0, unknown: 0 }
  for (const r of known) counts[r.sentiment] = (counts[r.sentiment] ?? 0) + 1
  let overallSentiment: Sentiment = 'unknown'
  let best = 0
  for (const s of ['negative', 'positive', 'neutral'] as Sentiment[]) {
    // priorité au négatif en cas d'égalité (un avis négatif compte double pour alerter)
    if (counts[s] > best) {
      best = counts[s]
      overallSentiment = s
    }
  }

  // Regroupement des claims par (type, valeur normalisée)
  type Bucket = Map<string, { value: string; engines: Set<IAEngineName> }>
  const byType = new Map<ClaimType, Bucket>()
  for (const r of known) {
    for (const c of r.claims) {
      if (!isClaimType(c.type)) continue
      const norm = normalizeClaimValue(c.value)
      if (!norm) continue
      if (!byType.has(c.type)) byType.set(c.type, new Map())
      const bucket = byType.get(c.type)!
      const entry = bucket.get(norm) ?? { value: c.value, engines: new Set<IAEngineName>() }
      entry.engines.add(r.engine)
      bucket.set(norm, entry)
    }
  }

  const claimsByType: ReputationSummary['claimsByType'] = []
  const disagreements: ClaimDisagreement[] = []
  // Ordre d'affichage stable
  const order: ClaimType[] = [
    'activite',
    'ville',
    'adresse',
    'horaires',
    'telephone',
    'prix',
    'service',
    'fondation',
    'autre',
  ]
  for (const type of order) {
    const bucket = byType.get(type)
    if (!bucket) continue
    const values = [...bucket.values()]
      .map((e) => ({ value: e.value, engines: [...e.engines] }))
      .sort((a, b) => b.engines.length - a.engines.length)
    claimsByType.push({ type, label: CLAIM_TYPE_LABELS[type], values })
    // Désaccord : au moins 2 valeurs distinctes affirmées par des moteurs différents,
    // sur un type factuel « dur » (pas activité/service/autre, trop libres).
    const factual: ClaimType[] = ['ville', 'adresse', 'horaires', 'telephone', 'prix', 'fondation']
    if (factual.includes(type) && values.length >= 2) {
      disagreements.push({ type, label: CLAIM_TYPE_LABELS[type], variants: values })
    }
  }

  return { knownByEngines, overallSentiment, disagreements, claimsByType }
}
