/**
 * lib/inngest/functions/monitor-sites.ts
 *
 * Surveillance récurrente (PLAN item 12) — le moteur de la récurrence :
 * - hebdomadaire (lundi 06:00 UTC) pour les sites des plans payants ;
 * - mensuelle (le 1er, 07:00 UTC) pour les sites du plan gratuit (teaser).
 * Chaque cron fan-out un événement par site (`site.monitor.requested`), traité
 * par une fonction dédiée avec une concurrence bornée — pas de Promise.all
 * non plafonné sur des appels LLM (règle CLAUDE.md §10).
 * Les sites gelés (downgrade) sont exclus.
 */

import { desc, eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { sites, subscriptions } from '@/lib/db/schema'
import { PLAN_LIMITS, computeFrozenSiteIds, type Plan } from '@/lib/plans'
import { runMonitoringCheck } from '@/lib/analysis/monitoring'
import { evaluateMonitoringAlerts } from '@/lib/analysis/alerts'

// Taille de l'échantillon par passage : 3 prompts × 4 moteurs = 12 mesures
// hebdo pour les payants ; 2 × 4 = 8 mesures mensuelles pour le gratuit.
const PAID_PROMPT_SAMPLE = 3
const FREE_PROMPT_SAMPLE = 2

/** Liste les sites actifs (non gelés) des utilisateurs du segment demandé. */
async function listMonitorableSites(segment: 'paid' | 'free'): Promise<string[]> {
  const rows = await db
    .select({
      siteId: sites.id,
      userId: sites.userId,
      createdAt: sites.createdAt,
      plan: subscriptions.plan,
    })
    .from(sites)
    .leftJoin(subscriptions, eq(subscriptions.userId, sites.userId))
    .orderBy(desc(sites.createdAt))

  // Regroupe par user pour appliquer la limite de sites du plan (sites gelés
  // exclus). Hypothèse : une seule subscription active par user (invariant
  // applicatif — upsertSubscription) ; si plusieurs lignes existaient, le plan
  // de la première serait retenu.
  const byUser = new Map<string, { plan: Plan; siteIds: string[] }>()
  for (const row of rows) {
    const plan = (row.plan ?? 'free') as Plan
    const entry = byUser.get(row.userId) ?? { plan, siteIds: [] }
    entry.siteIds.push(row.siteId)
    byUser.set(row.userId, entry)
  }

  const result: string[] = []
  for (const { plan, siteIds } of byUser.values()) {
    const isPaid = plan !== 'free'
    if (segment === 'paid' ? !isPaid : isPaid) continue
    const frozen = new Set(computeFrozenSiteIds(siteIds, PLAN_LIMITS[plan].sites))
    result.push(...siteIds.filter((id) => !frozen.has(id)))
  }
  return result
}

/** Cron hebdomadaire — sites des plans payants. */
export const monitorPaidSitesFunction = inngest.createFunction(
  { id: 'monitor-paid-sites-weekly', triggers: [{ cron: '0 6 * * 1' }] },
  async ({ step }) => {
    const siteIds = await step.run('list-paid-sites', () => listMonitorableSites('paid'))
    if (siteIds.length === 0) return { dispatched: 0 }

    await step.sendEvent(
      'fan-out-monitor',
      siteIds.map((siteId) => ({
        name: 'site.monitor.requested',
        data: { siteId, promptCount: PAID_PROMPT_SAMPLE },
      }))
    )
    return { dispatched: siteIds.length }
  }
)

/** Cron mensuel — sites du plan gratuit (le score bouge, les détails restent à débloquer). */
export const monitorFreeSitesFunction = inngest.createFunction(
  { id: 'monitor-free-sites-monthly', triggers: [{ cron: '0 7 1 * *' }] },
  async ({ step }) => {
    const siteIds = await step.run('list-free-sites', () => listMonitorableSites('free'))
    if (siteIds.length === 0) return { dispatched: 0 }

    await step.sendEvent(
      'fan-out-monitor',
      siteIds.map((siteId) => ({
        name: 'site.monitor.requested',
        data: { siteId, promptCount: FREE_PROMPT_SAMPLE },
      }))
    )
    return { dispatched: siteIds.length }
  }
)

/** Traite un site : échantillon de prompts × 4 moteurs → citation_checks. */
export const monitorSiteFunction = inngest.createFunction(
  {
    id: 'monitor-site',
    // 2 sites en parallèle max : lisse la charge LLM sur la fenêtre du cron
    concurrency: { limit: 2 },
    retries: 2,
    triggers: [{ event: 'site.monitor.requested' }],
  },
  async ({ event, step }) => {
    const { siteId, promptCount } = event.data as { siteId: string; promptCount: number }
    const runStartedAt = new Date()
    const result = await step.run('run-monitoring-check', () =>
      runMonitoringCheck(siteId, promptCount)
    )
    // Alertes email (PLAN item 13) : première citation / disparition
    const alert = await step.run('evaluate-alerts', () =>
      evaluateMonitoringAlerts(siteId, result, runStartedAt)
    )
    return { ...result, alert }
  }
)
