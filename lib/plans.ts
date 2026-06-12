/**
 * lib/plans.ts
 *
 * Modèle de plans V2 (cahier-des-charges §17.2) : 4 plans publics + admin.
 * Seule source de vérité pour les prix, limites et fonctionnalités par plan
 * (règle : jamais de prix ni limite hardcodés ailleurs).
 */

export const PLAN_LIMITS = {
  free:     { sites: 1,        creditsPerMonth: 500 },
  solo:     { sites: 2,        creditsPerMonth: 5_000 },
  pro:      { sites: 5,        creditsPerMonth: 20_000 },
  business: { sites: 15,       creditsPerMonth: 80_000 },
  admin:    { sites: Infinity, creditsPerMonth: Infinity },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuit',
  solo: 'Solo',
  pro: 'Pro',
  business: 'Business',
  admin: 'Admin',
}

export const PLAN_UPGRADE_URLS: Record<Plan, '/pricing' | null> = {
  free: '/pricing',
  solo: '/pricing',
  pro: '/pricing',
  business: null,
  admin: null,
}

// ─── Prix (€/mois) — l'annuel est facturé 12× le prix affiché (-20 %) ─────────

export const PLAN_PRICES = {
  solo: { monthly: 19, annual: 15 },
  pro: { monthly: 59, annual: 47 },
  business: { monthly: 149, annual: 119 },
} as const

export type PaidPlan = keyof typeof PLAN_PRICES
export type BillingPeriod = 'monthly' | 'annual'

// ─── Fonctionnalités par plan (§17.2) ─────────────────────────────────────────
// Les flags non encore branchés (pdfExport, historyDays) sont définis ici pour
// les tickets à venir (TKT-RULES-V2, TKT-COACH-V2, export PDF).

export interface PlanFeatures {
  /** Nombre max de pages en analyse page par page (0 = vue globale seule) */
  pageAnalysisLimit: number
  /** GEO se souvient des conversations entre sessions */
  coachMemory: boolean
  /** Génération des recommandations complètes (Sonnet) */
  fullRecommendations: boolean
  /** Fiches de recommandation non tronquées */
  recommendationSheets: boolean
  /** Les 15 publishers visibles (sinon 3 + flou) */
  publishersFull: boolean
  /** Export PDF des rapports ('none' | 'standard' | 'white_label') */
  pdfExport: 'none' | 'standard' | 'white_label'
  /** Rétention de l'historique des analyses en jours */
  historyDays: number
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    pageAnalysisLimit: 0,
    coachMemory: false,
    fullRecommendations: false,
    recommendationSheets: false,
    publishersFull: false,
    pdfExport: 'none',
    historyDays: 30,
  },
  solo: {
    pageAnalysisLimit: 5,
    coachMemory: true,
    fullRecommendations: false,
    recommendationSheets: true,
    publishersFull: true,
    pdfExport: 'none',
    historyDays: 90,
  },
  pro: {
    pageAnalysisLimit: 10,
    coachMemory: true,
    fullRecommendations: true,
    recommendationSheets: true,
    publishersFull: true,
    pdfExport: 'standard',
    historyDays: 365,
  },
  business: {
    pageAnalysisLimit: 10,
    coachMemory: true,
    fullRecommendations: true,
    recommendationSheets: true,
    publishersFull: true,
    pdfExport: 'white_label',
    historyDays: Infinity,
  },
  admin: {
    pageAnalysisLimit: 10,
    coachMemory: true,
    fullRecommendations: true,
    recommendationSheets: true,
    publishersFull: true,
    pdfExport: 'white_label',
    historyDays: Infinity,
  },
}

// ─── Sites gelés après downgrade (§17.5) ──────────────────────────────────────

/**
 * Fonction pure : retourne les ids gelés parmi des sites triés du plus récent
 * au plus ancien. Les plus récents restent actifs, les excédentaires passent
 * en lecture seule — jamais supprimés.
 */
export function computeFrozenSiteIds(orderedSiteIds: string[], limit: number): string[] {
  if (!Number.isFinite(limit)) return []
  return orderedSiteIds.slice(limit)
}

// ─── Packs de crédits (achat à la carte, §17.3) ───────────────────────────────
// Paiement one-shot Stripe — les crédits achetés n'expirent jamais.
// Le prix au crédit des packs reste volontairement supérieur à celui des
// abonnements : le pack dépanne, l'upgrade de plan reste la meilleure affaire.

export const CREDIT_PACKS = {
  starter: { label: 'Starter', credits: 500, priceEur: 5 },
  growth: { label: 'Growth', credits: 2_000, priceEur: 15 },
  power: { label: 'Power', credits: 8_000, priceEur: 49 },
} as const

export type CreditPackId = keyof typeof CREDIT_PACKS
