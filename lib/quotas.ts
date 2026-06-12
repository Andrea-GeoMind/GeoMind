/**
 * lib/quotas.ts
 *
 * Vérifications serveur des limites par plan (règle métier 2 : jamais de
 * confiance au client). Depuis TKT-CREDITS, les opérations coûteuses (analyses,
 * coach) sont gouvernées par le solde de crédits (lib/credits.ts) — seul le
 * nombre de sites reste une limite fixe par plan.
 */

import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { sites } from '@/lib/db/schema'
import {
  PLAN_LIMITS,
  PLAN_FEATURES,
  computeFrozenSiteIds,
  type Plan,
  type PlanFeatures,
} from '@/lib/plans'
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

// ─── Feature gates par plan (§17.2) ───────────────────────────────────────────

export async function getPlanFeatures(userId: string): Promise<PlanFeatures> {
  const plan = await getUserPlan(userId)
  return PLAN_FEATURES[plan]
}

export async function getPageAnalysisLimit(userId: string): Promise<number> {
  return (await getPlanFeatures(userId)).pageAnalysisLimit
}

export async function canUseCoachMemory(userId: string): Promise<boolean> {
  return (await getPlanFeatures(userId)).coachMemory
}

export async function canUseFullRecommendations(userId: string): Promise<boolean> {
  return (await getPlanFeatures(userId)).fullRecommendations
}

// ─── Sites gelés après downgrade (§17.5) ──────────────────────────────────────
// Un site est gelé quand le compte dépasse la limite du plan : les plus récents
// restent actifs, les excédentaires passent en lecture seule — jamais supprimés.
// Logique pure dans lib/plans.ts (computeFrozenSiteIds).

export async function getFrozenSiteIds(userId: string): Promise<string[]> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].sites
  if (!Number.isFinite(limit)) return []

  const rows = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.userId, userId))
    .orderBy(desc(sites.createdAt))

  return computeFrozenSiteIds(
    rows.map((r) => r.id),
    limit
  )
}

export async function isSiteFrozen(userId: string, siteId: string): Promise<boolean> {
  const frozen = await getFrozenSiteIds(userId)
  return frozen.includes(siteId)
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
