/**
 * lib/credits-shared.ts
 *
 * Partie pure du système de crédits (§17) : constantes et helpers sans accès DB,
 * importables côté client ('use client') comme côté serveur. La logique serveur
 * (soldes, consommation atomique) vit dans lib/credits.ts qui ré-exporte ce module.
 */

import type { Plan } from '@/lib/plans'

// ─── Coûts par opération ──────────────────────────────────────────────────────

export const CREDIT_COSTS = {
  /** Analyse complète : crawl + 4 IAs × prompts neutres + scoring */
  fullAnalysis: 400,
  /** Relance de l'analyse autorité seule */
  authorityOnly: 150,
  /** Relance de l'analyse technique seule */
  technicalOnly: 20,
  /** Relance de l'analyse contenu seule */
  contentOnly: 20,
  /** Analyse page par page — par page (TKT-RULES-V2) */
  pageAnalysisPerPage: 8,
  /** Message Coach IA, modèle Haiku */
  coachMessage: 10,
  /** Message Coach IA, modèle Sonnet (TKT-COACH-V2) */
  coachMessagePremium: 30,
  /** Génération de recommandation complète via Sonnet */
  completeRecommendation: 50,
} as const

export const WELCOME_BONUS_CREDITS = 1_000

/** Filet de sécurité si le webhook Stripe de renouvellement n'est pas passé */
const PAID_PLAN_RESET_FALLBACK_MS = 32 * 24 * 60 * 60 * 1000

// ─── Helpers purs (testés unitairement) ───────────────────────────────────────

/**
 * Le solde mensuel doit-il être réinitialisé ?
 * Free : au changement de mois calendaire (UTC) — vérifié en lazy, pas de cron.
 * Plans payants : le webhook Stripe reset à la date anniversaire ; ici uniquement
 * un filet de sécurité à 32 jours si le webhook a été manqué.
 */
export function needsMonthlyReset(lastResetAt: Date, plan: Plan, now: Date): boolean {
  if (plan === 'free') {
    return (
      lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
      lastResetAt.getUTCMonth() !== now.getUTCMonth()
    )
  }
  return now.getTime() - lastResetAt.getTime() > PAID_PLAN_RESET_FALLBACK_MS
}

/** Répartit une consommation entre solde mensuel et solde acheté (mensuel d'abord). */
export function splitConsumption(
  monthly: number,
  purchased: number,
  amount: number
): { fromMonthly: number; fromPurchased: number } | null {
  if (amount <= 0) return { fromMonthly: 0, fromPurchased: 0 }
  if (monthly + purchased < amount) return null
  const fromMonthly = Math.min(monthly, amount)
  return { fromMonthly, fromPurchased: amount - fromMonthly }
}

/**
 * Traduction humaine d'un solde — les crédits ne parlent pas aux TPE/PME (§17.1).
 * Affichée partout où un nombre de crédits apparaît.
 */
export function formatCreditsAsUsage(credits: number): string {
  if (!Number.isFinite(credits)) return 'illimité'
  if (credits < CREDIT_COSTS.coachMessage) return 'solde épuisé'
  const analyses = Math.floor(credits / CREDIT_COSTS.fullAnalysis)
  const questions = Math.floor(credits / CREDIT_COSTS.coachMessage)
  if (analyses === 0) return `≈ ${questions} questions à GEO`
  return `≈ ${analyses} analyse${analyses > 1 ? 's' : ''} complète${analyses > 1 ? 's' : ''} ou ${questions} questions à GEO`
}

/** Formatte un nombre de crédits pour l'affichage (séparateur de milliers fr). */
export function formatCreditsAmount(credits: number): string {
  if (!Number.isFinite(credits)) return '∞'
  return new Intl.NumberFormat('fr-FR').format(credits)
}
