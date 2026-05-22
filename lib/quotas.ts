import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { sites } from '@/lib/db/schema'
import { PLAN_LIMITS, type Plan } from '@/lib/plans'
import { countAllAnalyses, countAnalysesThisMonth } from '@/lib/db/queries/analyses'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'

async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await getSubscriptionByUserId(userId)
  return sub?.plan ?? 'free'
}

export async function canAddSite(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].sites

  const [result] = await db
    .select({ value: count() })
    .from(sites)
    .where(eq(sites.userId, userId))

  return (result?.value ?? 0) < limit
}

export async function canRunFullAnalysis(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].analyses
  // Free plan: 1 analyse à vie (lifetime, not monthly)
  const used = plan === 'free' ? await countAllAnalyses(userId) : await countAnalysesThisMonth(userId)
  return used < limit
}

export async function canRunTabAnalysis(userId: string): Promise<boolean> {
  return canRunFullAnalysis(userId)
}

export interface UsageCount {
  used: number
  limit: number
  remaining: number
}

export async function getRemainingAnalysesThisMonth(userId: string): Promise<UsageCount> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].analyses
  const used = plan === 'free' ? await countAllAnalyses(userId) : await countAnalysesThisMonth(userId)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

export async function getSitesUsage(userId: string): Promise<UsageCount> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].sites

  const [result] = await db
    .select({ value: count() })
    .from(sites)
    .where(eq(sites.userId, userId))

  const used = result?.value ?? 0
  return { used, limit, remaining: Math.max(0, limit - used) }
}

export interface UsageStats {
  plan: Plan
  sites: UsageCount
  analyses: UsageCount
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const plan = await getUserPlan(userId)
  const [sitesUsage, analysesUsage] = await Promise.all([
    getSitesUsage(userId),
    getRemainingAnalysesThisMonth(userId),
  ])
  return { plan, sites: sitesUsage, analyses: analysesUsage }
}
