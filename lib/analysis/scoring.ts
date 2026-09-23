// ─── Maturité GEO ─────────────────────────────────────────────────────────────

export type ScoreMaturityLevel = 'beginner' | 'progressing' | 'advanced' | 'expert'

export interface ScoreMaturity {
  label: string
  level: ScoreMaturityLevel
}

/**
 * Transforme un score numérique en niveau de maturité lisible.
 * Débutant (0-39) / En progression (40-69) / Avancé (70-89) / Expert (90-100)
 * Utilisé dans ScoreGauge et ScoreCard pour remplacer les labels "Bon/Moyen/Faible".
 */
export function getScoreMaturity(score: number): ScoreMaturity {
  if (score >= 90) return { label: 'Expert', level: 'expert' }
  if (score >= 70) return { label: 'Avancé', level: 'advanced' }
  if (score >= 40) return { label: 'En progression', level: 'progressing' }
  return { label: 'Débutant', level: 'beginner' }
}

// ─── Action prioritaire ───────────────────────────────────────────────────────

export type PillarKey = 'authority' | 'technical' | 'content'

export interface PriorityAction {
  pillar: PillarKey
  label: string
  description: string
  href: (siteId: string) => string
}

/**
 * Identifie le pilier le plus faible et retourne l'action prioritaire associée.
 * Utilisé sur la page d'ensemble pour guider l'utilisateur vers un seul point d'action.
 */
export function getPriorityAction(
  authorityScore: number | null,
  technicalScore: number,
  contentScore: number
): PriorityAction {
  // Un pilier non mesuré n'entre pas dans la comparaison : on ne peut pas le
  // désigner comme « le plus faible » sans l'avoir mesuré.
  const pillars: Array<{ key: PillarKey; score: number }> = [
    ...(authorityScore === null ? [] : [{ key: 'authority' as const, score: authorityScore }]),
    { key: 'technical', score: technicalScore },
    { key: 'content', score: contentScore },
  ]

  const weakest = pillars.reduce((min, p) => (p.score < min.score ? p : min), pillars[0]!)

  const ACTIONS: Record<PillarKey, Omit<PriorityAction, 'pillar'>> = {
    authority: {
      label: 'Boostez votre Autorité IA',
      description:
        'Votre site est rarement cité par les moteurs IA. Concentrez-vous sur les publishers et les signaux d\'autorité.',
      href: (id) => `/sites/${id}/authority`,
    },
    technical: {
      label: 'Corrigez vos problèmes Techniques',
      description:
        'Des frictions techniques empêchent les IAs de lire correctement votre site. Consultez les recommandations.',
      href: (id) => `/sites/${id}/technical`,
    },
    content: {
      label: 'Améliorez la structure de votre Contenu',
      description:
        'Votre contenu n\'est pas structuré pour les réponses IA. Suivez les recommandations de contenu.',
      href: (id) => `/sites/${id}/content`,
    },
  }

  return { pillar: weakest.key, ...ACTIONS[weakest.key]! }
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export interface AuthorityData {
  successfulCalls: number
  clientCitationsFound: number
}

export interface Scores {
  /** null quand l'autorité n'a pas pu être mesurée (voir computeGlobalScore). */
  globalScore: number | null
  /** null quand aucune réponse IA n'a été obtenue — « non mesuré », pas « zéro ». */
  authorityScore: number | null
  technicalScore: number
  contentScore: number
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Note Autorité : taux de citations client sur les appels IA réussis.
// successfulCalls = 0 → score 0 (pas de données).
/**
 * Note Autorité : part des réponses IA exploitables qui citent le domaine.
 *
 * Renvoie `null` — et non 0 — quand aucun appel n'a abouti : sans une seule
 * réponse, la visibilité n'a pas été *mesurée*. Les confondre revenait à
 * annoncer « 0/100 — Débutant » à un client dont l'analyse avait simplement
 * échoué (constaté en QA lors d'une coupure du fournisseur LLM).
 */
export function computeAuthorityScore(
  successfulCalls: number,
  clientCitationsFound: number
): number | null {
  if (successfulCalls === 0) return null
  return clamp((clientCitationsFound / successfulCalls) * 100)
}

// Note Technique : 100 − Σ pénalités détectées par les règles GEO techniques.
// Pénalités en points (ex: 20 pour HTTPS manquant). Résultat clampé à [0, 100].
// V1 — conservé pour compatibilité ; les runners utilisent computeIssuesScore (V2).
export function computeTechnicalScore(penalties: number[]): number {
  return clamp(100 - penalties.reduce((sum, p) => sum + p, 0))
}

// Note Contenu : 100 − Σ pénalités détectées par les règles GEO de contenu.
// V1 — conservé pour compatibilité ; les runners utilisent computeIssuesScore (V2).
export function computeContentScore(penalties: number[]): number {
  return clamp(100 - penalties.reduce((sum, p) => sum + p, 0))
}

// ─── Scoring V2 (cahier-des-charges §18.3) ────────────────────────────────────
// 1. Pénalité par sévérité (portée par issue.penalty, 0 pour les opportunités)
// 2. Issues de page : une même règle déclenchée sur plusieurs pages pèse
//    pénalité × (pages affectées / pages analysées), arrondi au supérieur
// 3. Plafond de 30 points de pénalité par catégorie
// Pure et déterministe : mêmes issues → même score.

export interface ScorableIssue {
  ruleKey: string
  category: string
  penalty: number
  /** null/undefined = issue au niveau site ; sinon issue rattachée à une page */
  pageUrl?: string | null
}

const CATEGORY_PENALTY_CAP = 30

/**
 * Points réellement récupérables sur un pilier : l'écart qui sépare la note de
 * 100, une fois le plafond par catégorie et la proratisation des règles de page
 * appliqués.
 *
 * L'interface affichait la somme brute des pénalités : « 12 points faibles ·
 * −45 pts » à côté d'une note de 87, et « encore 108 points de pénalité à
 * récupérer » quand le gain réel était de 29. Un client qui corrige tout doit
 * retrouver le chiffre qu'on lui a promis.
 */
export function recoverablePoints(score: number | null): number | null {
  if (score === null) return null
  return Math.max(0, 100 - score)
}

export function computeIssuesScore(issues: ScorableIssue[], pagesAnalyzed: number): number {
  const safePageCount = Math.max(1, pagesAnalyzed)

  // Pénalité par règle : pleine pour les règles site, proportionnelle pour les règles page
  const siteIssues = issues.filter((i) => !i.pageUrl && i.penalty > 0)
  const pageIssues = issues.filter((i) => i.pageUrl && i.penalty > 0)

  const penaltiesByCategory = new Map<string, number>()
  const add = (category: string, penalty: number) => {
    penaltiesByCategory.set(category, (penaltiesByCategory.get(category) ?? 0) + penalty)
  }

  for (const issue of siteIssues) {
    add(issue.category, issue.penalty)
  }

  // Règles page : groupées par ruleKey — N pages affectées sur M analysées
  const byRule = new Map<string, { category: string; penalty: number; affected: number }>()
  for (const issue of pageIssues) {
    const entry = byRule.get(issue.ruleKey)
    if (entry) {
      entry.affected += 1
    } else {
      byRule.set(issue.ruleKey, {
        category: issue.category,
        penalty: issue.penalty,
        affected: 1,
      })
    }
  }
  for (const { category, penalty, affected } of byRule.values()) {
    add(category, Math.ceil(penalty * (Math.min(affected, safePageCount) / safePageCount)))
  }

  let total = 0
  for (const categoryPenalty of penaltiesByCategory.values()) {
    total += Math.min(CATEGORY_PENALTY_CAP, categoryPenalty)
  }

  return clamp(100 - total)
}

/**
 * Note GEO globale : moyenne des 3 piliers (Autorité, Technique, Contenu).
 *
 * `null` si l'autorité n'a pas pu être mesurée : une moyenne sur deux piliers
 * se présenterait comme une note sur trois, ce qui serait trompeur.
 */
export function computeGlobalScore(
  authorityScore: number | null,
  technicalScore: number,
  contentScore: number
): number | null {
  if (authorityScore === null) return null
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
