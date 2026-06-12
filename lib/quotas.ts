/**
 * lib/quotas.ts
 *
 * Vérifications serveur des limites par plan (règle métier 2 : jamais de
 * confiance au client). Depuis TKT-CREDITS, les opérations coûteuses (analyses,
 * coach) sont gouvernées par le solde de crédits (lib/credits.ts) — seul le
 * nombre de sites reste une limite fixe par plan.
 */

import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { sites } from '@/lib/db/schema'
import { PLAN_LIMITS, type Plan } from '@/lib/plans'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import {
  CREDIT_COSTS,
  getUserCredits,
  hasEnoughCredits,
  type CreditBalance,
} from '@/lib/credits'

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
  return hasEnoughCredits(userId, CREDIT_COSTS.fullAnalysis)
}

export async function canRunTabAnalysis(userId: string): Promise<boolean> {
  return hasEnoughCredits(userId, CREDIT_COSTS.authorityOnly)
}

export async function canSendCoachMessage(userId: string): Promise<boolean> {
  return hasEnoughCredits(userId, CREDIT_COSTS.coachMessage)
}

export interface UsageCount {
  used: number
  limit: number
  remaining: number
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
  credits: CreditBalance
  /** Allocation mensuelle du plan (Infinity pour admin) */
  creditsPerMonth: number
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const plan = await getUserPlan(userId)
  const [sitesUsage, credits] = await Promise.all([
    getSitesUsage(userId),
    getUserCredits(userId),
  ])
  return {
    plan,
    sites: sitesUsage,
    credits,
    creditsPerMonth: PLAN_LIMITS[plan].creditsPerMonth,
  }
}
