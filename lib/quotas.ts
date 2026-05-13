import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { subscriptions, sites } from '@/lib/db/schema'
import { PLAN_LIMITS, type Plan } from '@/lib/plans'
import { countAnalysesThisMonth } from '@/lib/db/queries/analyses'

export async function canAddSite(userId: string): Promise<boolean> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true },
  })
  const plan: Plan = sub?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan].sites

  const [result] = await db
    .select({ value: count() })
    .from(sites)
    .where(eq(sites.userId, userId))

  return (result?.value ?? 0) < limit
}

export async function canRunFullAnalysis(userId: string): Promise<boolean> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true },
  })
  const plan: Plan = sub?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan].analyses

  const used = await countAnalysesThisMonth(userId)
  return used < limit
}
