import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { env } from '@/lib/env'
import {
  upsertSubscription,
  cancelSubscription,
  getSubscriptionByStripeCustomerId,
} from '@/lib/db/queries/subscriptions'

export const dynamic = 'force-dynamic'

const HANDLED_EVENTS = new Set([
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

  try {
    await handleEvent(event)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[stripe-webhook] Error handling ${event.type}:`, message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
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

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    plan,
    status,
    currentPeriodEnd,
  })
}
