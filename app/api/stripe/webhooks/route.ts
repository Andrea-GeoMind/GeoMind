import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { env } from '@/lib/env'
import {
  upsertSubscription,
  cancelSubscription,
  getSubscriptionByStripeCustomerId,
  getSubscriptionByUserId,
} from '@/lib/db/queries/subscriptions'
import {
  addPurchasedCredits,
  hasPackTransactionForSession,
  resetMonthlyCredits,
  topUpMonthlyCredits,
} from '@/lib/credits'
import { claimWebhookEvent, releaseWebhookEvent } from '@/lib/db/queries/webhook-events'
import { CREDIT_PACKS, PLAN_LIMITS, type CreditPackId } from '@/lib/plans'
import { trackEvent } from '@/lib/posthog'

export const dynamic = 'force-dynamic'

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  // Idempotence : Stripe rejoue les événements avec le même id — chaque id
  // n'est traité qu'une fois (protège le reset de crédits et la synchro plan).
  const claimed = await claimWebhookEvent(event.id, event.type)
  if (!claimed) {
    return NextResponse.json({ received: true, replayed: true })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[stripe-webhook] Error handling ${event.type}:`, message)
    // Libère le claim pour que le retry Stripe puisse reprocesser l'événement.
    await releaseWebhookEvent(event.id)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.type === 'credit_pack') {
        await handleCreditPackPurchase(session)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await syncSubscription(sub)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const existing = await getSubscriptionByStripeCustomerId(customerId)
      if (existing) {
        await cancelSubscription(existing.userId)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subRef = invoice.parent?.subscription_details?.subscription
      if (subRef) {
        const subId = typeof subRef === 'string' ? subRef : subRef.id
        const sub = await stripe.subscriptions.retrieve(subId)
        await syncSubscription(sub)
        // Reset des crédits mensuels à la date anniversaire de facturation (§17.4)
        const userId = sub.metadata?.userId
        if (userId) {
          const priceId = sub.items.data[0]?.price.id ?? ''
          await resetMonthlyCredits(userId, planFromPriceId(priceId))
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subRef = invoice.parent?.subscription_details?.subscription
      if (subRef) {
        const subId = typeof subRef === 'string' ? subRef : subRef.id
        const sub = await stripe.subscriptions.retrieve(subId)
        await syncSubscription(sub, 'past_due')
      }
      break
    }
  }
}

/**
 * Crédite un pack acheté (§17.3). Idempotent : Stripe peut rejouer le webhook,
 * la session n'est créditée qu'une fois (vérif sur sessionId en DB).
 */
async function handleCreditPackPurchase(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  const packId = session.metadata?.packId as CreditPackId | undefined

  if (!userId || !packId || !(packId in CREDIT_PACKS)) {
    console.error('[stripe-webhook] credit_pack: metadata invalide', session.id)
    return
  }

  if (await hasPackTransactionForSession(session.id)) {
    return // webhook rejoué — déjà crédité
  }

  const pack = CREDIT_PACKS[packId]
  await addPurchasedCredits(userId, pack.credits, 'pack_purchase', {
    packId,
    sessionId: session.id,
  })

  trackEvent(userId, 'credit_pack_purchased', {
    packId,
    credits: pack.credits,
    priceEur: pack.priceEur,
  })
}

async function syncSubscription(
  sub: Stripe.Subscription,
  forceStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete',
): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = sub.metadata?.userId

  if (!userId) {
    console.error('[stripe-webhook] Missing userId in subscription metadata', sub.id)
    return
  }

  const priceId = sub.items.data[0]?.price.id ?? ''
  const plan = planFromPriceId(priceId)

  const rawStatus = sub.status
  const validStatuses = ['active', 'canceled', 'past_due', 'trialing', 'incomplete'] as const
  type ValidStatus = (typeof validStatuses)[number]
  const status: ValidStatus = forceStatus ?? (validStatuses.includes(rawStatus as ValidStatus)
    ? (rawStatus as ValidStatus)
    : 'incomplete')

  const currentPeriodEnd = sub.items.data[0]?.current_period_end
    ? new Date(sub.items.data[0].current_period_end * 1000)
    : null

  // Plan avant mise à jour — pour détecter un upgrade et compléter les crédits (§17.5)
  const previousSub = await getSubscriptionByUserId(userId)
  const previousPlan = previousSub?.plan ?? 'free'

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    plan,
    status,
    currentPeriodEnd,
  })

  // Upgrade → la différence d'allocation mensuelle est créditée immédiatement
  const previousAllowance = PLAN_LIMITS[previousPlan].creditsPerMonth
  const newAllowance = PLAN_LIMITS[plan].creditsPerMonth
  if (
    Number.isFinite(previousAllowance) &&
    Number.isFinite(newAllowance) &&
    newAllowance > previousAllowance
  ) {
    await topUpMonthlyCredits(userId, newAllowance - previousAllowance, {
      from: previousPlan,
      to: plan,
    })
  }

  // Track plan upgrade event
  trackEvent(userId, 'plan_upgraded', {
    stripeCustomerId: customerId,
    plan,
    status,
  })
}
