/**
 * lib/analysis/geo-rules.ts
 *
 * Socle commun des règles GEO V2 (cahier-des-charges §18) : sévérités,
 * pénalités, version de méthodologie. Partagé entre les règles techniques
 * et contenu — module pur, sans accès DB.
 */

/** Version de la méthodologie d'audit. Incrémentée à chaque évolution des règles
 *  ou du scoring. Stockée sur chaque analyse (analyses.rules_version) pour que
 *  les comparaisons N vs N-1 puissent signaler un changement de méthodologie. */
export const RULES_VERSION = 2

export type IssueSeverity = 'major' | 'moderate' | 'minor' | 'opportunity'

/** Pénalités par sévérité (§18.3). Les opportunités ne pénalisent jamais. */
export const SEVERITY_PENALTIES: Record<IssueSeverity, number> = {
  major: 12,
  moderate: 6,
  minor: 3,
  opportunity: 0,
}

/** Plafond de pénalité par catégorie : une seule catégorie défaillante
 *  ne peut pas couler le score à elle seule (§18.3). */
export const CATEGORY_PENALTY_CAP = 30

/** Effort de correction estimé : 1 = quick win (< 30 min), 3 = chantier. */
export type IssueEffort = 1 | 2 | 3
/** Impact GEO estimé : 1 = marginal, 3 = déterminant. */
export type IssueImpact = 1 | 2 | 3

export function penaltyForSeverity(severity: IssueSeverity): number {
  return SEVERITY_PENALTIES[severity]
}

/** Une issue est un "quick win" si elle est facile et rentable (§18.7). */
export function isQuickWin(issue: { effort: number; impact: number; severity: string }): boolean {
  return issue.severity !== 'opportunity' && issue.effort === 1 && issue.impact >= 2
}
