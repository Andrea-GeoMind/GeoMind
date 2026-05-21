import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'

export type SubscriptionRow = typeof subscriptions.$inferSelect

export async function getSubscriptionByUserId(userId: string): Promise<SubscriptionRow | null> {
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))
  return row ?? null
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  return row ?? null
}

export async function upsertSubscription(data: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  plan: 'free' | 'pro' | 'business' | 'admin'
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  currentPeriodEnd: Date | null
}): Promise<SubscriptionRow> {
  const existing = await getSubscriptionByUserId(data.userId)

  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        plan: data.plan,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, data.userId))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
    })
    .returning()
  return created
}

export async function cancelSubscription(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      plan: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
}
