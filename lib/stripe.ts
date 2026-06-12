import Stripe from 'stripe'
import { env } from '@/lib/env'
import type { CreditPackId, PaidPlan, BillingPeriod } from '@/lib/plans'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

/**
 * Price IDs par plan × périodicité (§17.2 : 6 prix au total).
 * undefined tant que le produit n'existe pas dans Stripe — le checkout
 * correspondant est alors désactivé côté UI.
 */
export const STRIPE_PLAN_PRICE_IDS: Record<
  PaidPlan,
  Record<BillingPeriod, string | undefined>
> = {
  solo: {
    monthly: env.STRIPE_SOLO_PRICE_ID,
    annual: env.STRIPE_SOLO_ANNUAL_PRICE_ID,
  },
  pro: {
    monthly: env.STRIPE_PRO_PRICE_ID,
    annual: env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  business: {
    monthly: env.STRIPE_BUSINESS_PRICE_ID,
    annual: env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
  },
}

/** Price IDs des packs de crédits — undefined tant que les produits Stripe n'existent pas */
export const CREDIT_PACK_PRICE_IDS: Record<CreditPackId, string | undefined> = {
  starter: env.STRIPE_PACK_STARTER_PRICE_ID,
  growth: env.STRIPE_PACK_GROWTH_PRICE_ID,
  power: env.STRIPE_PACK_POWER_PRICE_ID,
}

export type StripePlan = PaidPlan

/**
 * Retrouve le plan GeoMind à partir d'un price ID Stripe (mensuel ou annuel).
 * Retourne 'free' si aucun match (ex. abonnement annulé).
 */
export function planFromPriceId(priceId: string): 'free' | PaidPlan {
  for (const plan of Object.keys(STRIPE_PLAN_PRICE_IDS) as PaidPlan[]) {
    const prices = STRIPE_PLAN_PRICE_IDS[plan]
    if (priceId === prices.monthly || priceId === prices.annual) return plan
  }
  return 'free'
}
