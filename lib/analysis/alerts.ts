/**
 * lib/analysis/alerts.ts
 *
 * Évaluation des alertes de visibilité après un passage de surveillance
 * (PLAN item 13). Deux signaux, volontairement rares pour rester crédibles :
 * - première citation détectée de l'histoire du site → célébration ;
 * - zéro citation sur le passage alors que la moyenne 30 j était ≥ 25 % → alerte.
 * Respecte profiles.email_notifications. Les échecs d'envoi sont loggés,
 * jamais bloquants.
 */

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { profiles, sites } from '@/lib/db/schema'
import { getCitationRateBetween } from '@/lib/db/queries/citation-checks'
import {
  sendFirstCitationEmail,
  sendVisibilityDropEmail,
  sendAnalysisCompleteEmail,
} from '@/lib/email/templates/visibility-alerts'
import type { MonitoringCheckResult } from '@/lib/analysis/monitoring'

const DROP_ALERT_MIN_PREVIOUS_RATE = 25 // % — en dessous, une absence n'est pas un signal

async function getSiteOwner(siteId: string) {
  const [row] = await db
    .select({
      siteName: sites.name,
      email: profiles.email,
      emailNotifications: profiles.emailNotifications,
    })
    .from(sites)
    .innerJoin(profiles, eq(profiles.id, sites.userId))
    .where(eq(sites.id, siteId))
  return row ?? null
}

export type MonitoringAlert = 'first_citation' | 'visibility_drop' | null

/**
 * Évalue et envoie au plus une alerte après un passage de surveillance.
 * `runStartedAt` borne la fenêtre « avant ce passage ».
 */
export async function evaluateMonitoringAlerts(
  siteId: string,
  result: MonitoringCheckResult,
  runStartedAt: Date
): Promise<MonitoringAlert> {
  if (result.successfulCalls === 0) return null

  const owner = await getSiteOwner(siteId)
  if (!owner || !owner.emailNotifications) return null

  const since = new Date(runStartedAt.getTime() - 30 * 24 * 60 * 60 * 1000)
  const before = await getCitationRateBetween(siteId, new Date(0), runStartedAt)
  const rolling30Before = await getCitationRateBetween(siteId, since, runStartedAt)

  try {
    // Première citation de l'histoire du site
    if (result.citedCalls > 0 && before.cited === 0) {
      await sendFirstCitationEmail({ to: owner.email, siteName: owner.siteName, siteId })
      return 'first_citation'
    }

    // Disparition : zéro citation sur ce passage alors que la moyenne tenait
    if (
      result.citedCalls === 0 &&
      rolling30Before.rate !== null &&
      rolling30Before.rate >= DROP_ALERT_MIN_PREVIOUS_RATE
    ) {
      await sendVisibilityDropEmail({
        to: owner.email,
        siteName: owner.siteName,
        siteId,
        previousRate: rolling30Before.rate,
      })
      return 'visibility_drop'
    }
  } catch (err) {
    console.error(`[GeoMind/alerts] Échec envoi alerte pour site ${siteId}:`, err)
  }

  return null
}

/** Email de fin d'analyse — meilleur levier de retour produit. Best-effort. */
export async function notifyAnalysisComplete(params: {
  siteId: string
  globalScore: number | null
}): Promise<void> {
  const owner = await getSiteOwner(params.siteId)
  if (!owner || !owner.emailNotifications) return
  try {
    await sendAnalysisCompleteEmail({
      to: owner.email,
      siteName: owner.siteName,
      siteId: params.siteId,
      globalScore: params.globalScore,
    })
  } catch (err) {
    console.error(`[GeoMind/alerts] Échec email analyse terminée (${params.siteId}):`, err)
  }
}
