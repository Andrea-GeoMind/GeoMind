/**
 * lib/credits.ts
 *
 * Système de crédits universel (cahier-des-charges §17).
 * 1 crédit ≈ 0,001 € de coût API réel (marge ×2 incluse dans les coûts ci-dessous).
 *
 * Deux soldes par user : monthly_credits (alloués par le plan, reset à la date
 * anniversaire de facturation via webhook Stripe + filet lazy) et
 * purchased_credits (packs, n'expirent jamais). Consommation : mensuels d'abord.
 *
 * La consommation est atomique (UPDATE conditionnel) — jamais de solde négatif,
 * y compris en cas d'appels concurrents.
 */

import { eq, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { creditBalances, creditTransactions, profiles } from '@/lib/db/schema'
import { PLAN_LIMITS, type Plan } from '@/lib/plans'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { sendLowCreditsEmail } from '@/lib/email/templates/low-credits'
import { logAudit } from '@/lib/db/queries/audit-log'
import { WELCOME_BONUS_CREDITS, needsMonthlyReset } from '@/lib/credits-shared'

// Helpers purs et constantes : voir lib/credits-shared.ts (importable côté client)
export {
  CREDIT_COSTS,
  WELCOME_BONUS_CREDITS,
  needsMonthlyReset,
  splitConsumption,
  formatCreditsAsUsage,
  formatCreditsAmount,
} from '@/lib/credits-shared'

const LOW_CREDIT_THRESHOLD_RATIO = 0.2

export type CreditTransactionReason =
  | 'welcome_bonus'
  | 'monthly_reset'
  | 'pack_purchase'
  | 'analysis'
  | 'coach_message'
  | 'recommendation'
  | 'refund_failed_analysis'
  | 'admin_adjustment'

export interface CreditBalance {
  monthly: number
  purchased: number
  total: number
}

export type ConsumeResult =
  | { ok: true; balance: CreditBalance }
  | { ok: false; balance: CreditBalance }

// ─── Accès au solde ───────────────────────────────────────────────────────────

async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await getSubscriptionByUserId(userId)
  return sub?.plan ?? 'free'
}

interface BalanceRow {
  monthlyCredits: number
  purchasedCredits: number
  lastResetAt: Date
  lowCreditAlertedAt: Date | null
}

/**
 * Garantit l'existence et la fraîcheur du solde :
 * - première interaction → création avec allocation du plan + bonus de bienvenue
 *   (couvre aussi la migration des comptes existants, §17.8)
 * - reset mensuel lazy si nécessaire
 */
async function ensureBalance(userId: string, plan: Plan): Promise<BalanceRow> {
  const allowance = PLAN_LIMITS[plan].creditsPerMonth
  const initialMonthly = Number.isFinite(allowance) ? allowance : 0

  const [existing] = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))

  if (!existing) {
    const inserted = await db
      .insert(creditBalances)
      .values({
        userId,
        monthlyCredits: initialMonthly,
        purchasedCredits: WELCOME_BONUS_CREDITS,
      })
      .onConflictDoNothing()
      .returning()

    if (inserted.length > 0) {
      await db.insert(creditTransactions).values([
        { userId, amount: WELCOME_BONUS_CREDITS, reason: 'welcome_bonus' },
        { userId, amount: initialMonthly, reason: 'monthly_reset' },
      ])
      return inserted[0]
    }
    // Course perdue : un appel concurrent a créé la ligne — on la relit.
    const [row] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
    return row
  }

  // Filet QA : un compte free hérité de V1 peut porter des crédits « mensuels »
  // alors que le plan n'a plus d'allocation — on préserve la valeur en les
  // déplaçant vers le solde acheté (sans expiration), une seule fois.
  // (Migration 0015 fait la même chose en masse ; ceci couvre les retardataires.)
  if (initialMonthly === 0 && existing.monthlyCredits > 0) {
    const [moved] = await db
      .update(creditBalances)
      .set({
        purchasedCredits: sql`${creditBalances.purchasedCredits} + ${existing.monthlyCredits}`,
        monthlyCredits: 0,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning()
    await db.insert(creditTransactions).values({
      userId,
      amount: 0,
      reason: 'admin_adjustment',
      metadata: { type: 'v1_free_monthly_to_purchased', moved: existing.monthlyCredits },
    })
    return moved
  }

  if (needsMonthlyReset(existing.lastResetAt, plan, new Date())) {
    return resetMonthlyCredits(userId, plan)
  }

  return existing
}

/** Reset du solde mensuel à l'allocation du plan. Appelé par le webhook Stripe et en lazy. */
export async function resetMonthlyCredits(userId: string, plan?: Plan): Promise<BalanceRow> {
  const resolvedPlan = plan ?? (await getUserPlan(userId))
  const allowance = PLAN_LIMITS[resolvedPlan].creditsPerMonth
  const monthly = Number.isFinite(allowance) ? allowance : 0

  const [updated] = await db
    .update(creditBalances)
    .set({
      monthlyCredits: monthly,
      lastResetAt: new Date(),
      lowCreditAlertedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(creditBalances.userId, userId))
    .returning()

  if (!updated) {
    // Pas encore de ligne (webhook arrivé avant toute interaction) — init complète.
    return ensureBalance(userId, resolvedPlan)
  }

  await db.insert(creditTransactions).values({
    userId,
    amount: monthly,
    reason: 'monthly_reset',
  })

  return updated
}

export async function getUserCredits(userId: string): Promise<CreditBalance> {
  const plan = await getUserPlan(userId)
  if (plan === 'admin') {
    return { monthly: Infinity, purchased: Infinity, total: Infinity }
  }
  const row = await ensureBalance(userId, plan)
  return {
    monthly: row.monthlyCredits,
    purchased: row.purchasedCredits,
    total: row.monthlyCredits + row.purchasedCredits,
  }
}

export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getUserCredits(userId)
  return balance.total >= amount
}

// ─── Mouvements ───────────────────────────────────────────────────────────────

/**
 * Consomme des crédits de façon atomique. Retourne { ok: false } si le solde est
 * insuffisant — jamais de solde négatif, même en concurrence.
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  reason: CreditTransactionReason,
  metadata?: Record<string, unknown>
): Promise<ConsumeResult> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error(`consumeCredits: montant invalide (${amount})`)
  }

  const plan = await getUserPlan(userId)
  if (plan === 'admin') {
    return { ok: true, balance: { monthly: Infinity, purchased: Infinity, total: Infinity } }
  }

  const before = await ensureBalance(userId, plan)

  // UPDATE conditionnel : ne passe que si le solde total couvre le montant.
  // Les expressions à droite lisent toutes les valeurs AVANT update (sémantique SQL).
  const rows = (await db.execute(sql`
    UPDATE credit_balances
    SET monthly_credits = monthly_credits - LEAST(monthly_credits, ${amount}),
        purchased_credits = purchased_credits - GREATEST(${amount} - monthly_credits, 0),
        updated_at = now()
    WHERE user_id = ${userId}
      AND monthly_credits + purchased_credits >= ${amount}
    RETURNING monthly_credits, purchased_credits
  `)) as Array<{ monthly_credits: number; purchased_credits: number }>

  if (rows.length === 0) {
    return {
      ok: false,
      balance: {
        monthly: before.monthlyCredits,
        purchased: before.purchasedCredits,
        total: before.monthlyCredits + before.purchasedCredits,
      },
    }
  }

  const after = rows[0]

  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    reason,
    metadata,
  })

  await maybeSendLowCreditAlert(userId, plan, after.monthly_credits, before.lowCreditAlertedAt)

  return {
    ok: true,
    balance: {
      monthly: after.monthly_credits,
      purchased: after.purchased_credits,
      total: after.monthly_credits + after.purchased_credits,
    },
  }
}

/**
 * Complète le solde mensuel à l'upgrade de plan (§17.5) : la différence entre
 * l'ancienne et la nouvelle allocation est créditée immédiatement.
 */
export async function topUpMonthlyCredits(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (amount <= 0 || !Number.isInteger(amount)) return

  const plan = await getUserPlan(userId)
  if (plan === 'admin') return

  await ensureBalance(userId, plan)
  await db
    .update(creditBalances)
    .set({
      monthlyCredits: sql`${creditBalances.monthlyCredits} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(creditBalances.userId, userId))

  await db.insert(creditTransactions).values({
    userId,
    amount,
    reason: 'monthly_reset',
    metadata: { ...metadata, type: 'plan_upgrade_topup' },
  })
}

/** Crédite le solde acheté (packs Stripe, remboursements). */
export async function addPurchasedCredits(
  userId: string,
  amount: number,
  reason: CreditTransactionReason,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error(`addPurchasedCredits: montant invalide (${amount})`)
  }

  const plan = await getUserPlan(userId)
  if (plan === 'admin') return

  await ensureBalance(userId, plan)
  await db
    .update(creditBalances)
    .set({
      purchasedCredits: sql`${creditBalances.purchasedCredits} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(creditBalances.userId, userId))

  await db.insert(creditTransactions).values({ userId, amount, reason, metadata })
}

/**
 * Remboursement automatique (analyse échouée techniquement, §17.4).
 * Crédité sur le solde acheté : il n'expire pas, l'utilisateur ne perd rien.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await addPurchasedCredits(userId, amount, 'refund_failed_analysis', metadata)
  // Trace les remboursements significatifs (PLAN item 38) — best-effort
  if (amount >= 50) {
    await logAudit('credits.refunded', userId, { amount, ...metadata })
  }
}

/** Historique des mouvements pour la page Usage. */
export async function getCreditTransactions(userId: string, limit = 20) {
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
}

/** Une transaction pack existe-t-elle déjà pour cette session Stripe ? (idempotence webhook) */
export async function hasPackTransactionForSession(sessionId: string): Promise<boolean> {
  const rows = (await db.execute(sql`
    SELECT 1 FROM credit_transactions
    WHERE reason = 'pack_purchase' AND metadata->>'sessionId' = ${sessionId}
    LIMIT 1
  `)) as Array<Record<string, unknown>>
  return rows.length > 0
}

// ─── Alerte 20 % (§17.6) ─────────────────────────────────────────────────────

async function maybeSendLowCreditAlert(
  userId: string,
  plan: Plan,
  monthlyAfter: number,
  alreadyAlertedAt: Date | null
): Promise<void> {
  if (alreadyAlertedAt) return
  const allowance = PLAN_LIMITS[plan].creditsPerMonth
  if (!Number.isFinite(allowance) || allowance <= 0) return

  const threshold = Math.floor(allowance * LOW_CREDIT_THRESHOLD_RATIO)
  if (monthlyAfter >= threshold) return

  // Flag d'abord (une seule alerte par cycle, même si l'email échoue)
  await db
    .update(creditBalances)
    .set({ lowCreditAlertedAt: new Date(), updatedAt: new Date() })
    .where(eq(creditBalances.userId, userId))

  try {
    const [profile] = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, userId))
    if (profile?.email) {
      await sendLowCreditsEmail({
        to: profile.email,
        remaining: monthlyAfter,
        allowance,
      })
    }
  } catch (err) {
    console.error('[credits] Échec envoi email alerte crédits bas:', err)
  }
}
