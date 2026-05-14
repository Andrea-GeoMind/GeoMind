import Stripe from 'stripe'
import { env } from '@/lib/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export const STRIPE_PRICE_IDS = {
  pro: env.STRIPE_PRO_PRICE_ID,
  business: env.STRIPE_BUSINESS_PRICE_ID,
} as const

export type StripePlan = keyof typeof STRIPE_PRICE_IDS

/**
 * Retrouve le plan GeoMind à partir d'un price ID Stripe.
 * Retourne 'free' si aucun match (ex. abonnement annulé).
 */
export function planFromPriceId(priceId: string): 'free' | 'pro' | 'business' {
  if (priceId === STRIPE_PRICE_IDS.pro) return 'pro'
  if (priceId === STRIPE_PRICE_IDS.business) return 'business'
  return 'free'
}
