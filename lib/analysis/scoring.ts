export interface AuthorityData {
  successfulCalls: number
  clientCitationsFound: number
}

export interface Scores {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Note Autorité : taux de citations client sur les appels IA réussis.
// successfulCalls = 0 → score 0 (pas de données).
export function computeAuthorityScore(
  successfulCalls: number,
  clientCitationsFound: number
): number {
  if (successfulCalls === 0) return 0
  return clamp((clientCitationsFound / successfulCalls) * 100)
}

// Note Technique : 100 − Σ pénalités détectées par les règles GEO techniques.
// Pénalités en points (ex: 20 pour HTTPS manquant). Résultat clampé à [0, 100].
export function computeTechnicalScore(penalties: number[]): number {
  return clamp(100 - penalties.reduce((sum, p) => sum + p, 0))
}

// Note Contenu : 100 − Σ pénalités détectées par les règles GEO de contenu.
export function computeContentScore(penalties: number[]): number {
  return clamp(100 - penalties.reduce((sum, p) => sum + p, 0))
}

// Note GEO globale : moyenne des 3 piliers (Autorité, Technique, Contenu).
export function computeGlobalScore(
  authorityScore: number,
  technicalScore: number,
  contentScore: number
): number {
  return clamp((authorityScore + technicalScore + contentScore) / 3)
}

// Orchestrateur — calcule les 4 scores à partir des résultats bruts de chaque sous-analyse.
// technicalScore et contentScore sont des valeurs 0–100 déjà calculées par leurs runners.
export function computeScores(
  authorityData: AuthorityData,
  technicalScore: number,
  contentScore: number
): Scores {
  const authorityScore = computeAuthorityScore(
    authorityData.successfulCalls,
    authorityData.clientCitationsFound
  )
  const clampedTechnical = clamp(technicalScore)
  const clampedContent = clamp(contentScore)
  const globalScore = computeGlobalScore(authorityScore, clampedTechnical, clampedContent)

  return {
    globalScore,
    authorityScore,
    technicalScore: clampedTechnical,
    contentScore: clampedContent,
  }
}
