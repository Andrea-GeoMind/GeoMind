'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS, type StripePlan } from '@/lib/stripe'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { env } from '@/lib/env'

const APP_URL = env.NEXT_PUBLIC_SITE_URL

export async function createCheckoutSession(plan: StripePlan): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const subscription = await getSubscriptionByUserId(user.id)
  const stripeCustomerId = subscription?.stripeCustomerId ?? undefined

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : user.email,
    line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/settings/billing?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Stripe session URL manquante')

  redirect(session.url)
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

  redirect(session.url)
}
