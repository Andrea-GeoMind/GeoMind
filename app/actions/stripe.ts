'use server'

import { redirect } from 'next/navigation'

// next/navigation redirect is typed for internal routes; Stripe returns external https:// URLs
const redirectExternal: (url: string) => never = redirect as (url: string) => never
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLAN_PRICE_IDS, CREDIT_PACK_PRICE_IDS, type StripePlan } from '@/lib/stripe'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { CREDIT_PACKS, type CreditPackId, type BillingPeriod } from '@/lib/plans'
import { env } from '@/lib/env'
import { trackEvent } from '@/lib/posthog'

const APP_URL = env.NEXT_PUBLIC_SITE_URL

export async function createCheckoutSession(
  plan: StripePlan,
  period: BillingPeriod = 'monthly'
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const priceId = STRIPE_PLAN_PRICE_IDS[plan][period]
  if (!priceId) {
    throw new Error(
      `Plan "${plan}" (${period}) indisponible : price ID Stripe non configuré`
    )
  }

  const subscription = await getSubscriptionByUserId(user.id)
  const stripeCustomerId = subscription?.stripeCustomerId ?? undefined

  // Essai Pro 7 jours (PLAN item 25) : uniquement à la première souscription
  // payante — un client qui a déjà eu un abonnement Stripe ne re-bénéficie
  // pas de l'essai (anti-abus simple, vérité serveur).
  const isFirstPaidSubscription = !subscription?.stripeSubscriptionId
  const trialDays = plan === 'pro' && isFirstPaidSubscription ? 7 : undefined

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/settings/billing?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
      ...(trialDays ? { trial_period_days: trialDays } : {}),
    },
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Stripe session URL manquante')

  trackEvent(user.id, 'plan_upgrade_started', { plan, period })
  redirectExternal(session.url)
}

/**
 * Checkout one-shot pour un pack de crédits (§17.3). Les crédits sont ajoutés
 * par le webhook checkout.session.completed — jamais ici (source de vérité Stripe).
 */
export async function createCreditPackCheckout(packId: CreditPackId): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const priceId = CREDIT_PACK_PRICE_IDS[packId]
  if (!priceId) {
    throw new Error(
      `Pack "${packId}" indisponible : STRIPE_PACK_${packId.toUpperCase()}_PRICE_ID non configuré`
    )
  }

  const subscription = await getSubscriptionByUserId(user.id)
  const stripeCustomerId = subscription?.stripeCustomerId ?? undefined

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?pack_success=1`,
    cancel_url: `${APP_URL}/settings/billing?canceled=1`,
    metadata: { userId: user.id, type: 'credit_pack', packId },
  })

  if (!session.url) throw new Error('Stripe session URL manquante')

  trackEvent(user.id, 'credit_pack_checkout_started', {
    packId,
    credits: CREDIT_PACKS[packId].credits,
  })
  redirectExternal(session.url)
}

export async function createPortalSession(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const subscription = await getSubscriptionByUserId(user.id)

  if (!subscription?.stripeCustomerId) {
    throw new Error('Aucun customer Stripe associé à ce compte')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
  })

  redirectExternal(session.url)
}
