/**
 * lib/db/queries/pixel.ts
 *
 * Accès DB du Pixel GeoMind (PLAN item 29) : clé pixel, ingestion d'événements,
 * agrégats pour le dashboard.
 */

import { randomBytes } from 'crypto'
import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { sites, pixelEvents } from '@/lib/db/schema'
import type { PixelEventLite } from '@/lib/analysis/pixel'

/** Retrouve un site par sa clé pixel (ingestion publique). */
export async function getSiteByPixelKey(pixelKey: string) {
  const [row] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.pixelKey, pixelKey))
    .limit(1)
  return row ?? null
}

/** Génère (ou régénère) la clé pixel d'un site. Ownership vérifié par l'appelant. */
export async function ensurePixelKey(siteId: string, rotate = false): Promise<string> {
  const [existing] = await db
    .select({ pixelKey: sites.pixelKey })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)

  if (existing?.pixelKey && !rotate) return existing.pixelKey

  const key = `gmx_${randomBytes(18).toString('hex')}`
  await db.update(sites).set({ pixelKey: key, updatedAt: new Date() }).where(eq(sites.id, siteId))
  return key
}

export interface PixelEventInsert {
  siteId: string
  type: 'pageview' | 'action'
  aiSource: string
  path: string
  actionKind: string | null
  visitorHash: string
}

export async function insertPixelEvent(e: PixelEventInsert): Promise<void> {
  await db.insert(pixelEvents).values(e)
}

/** Charge les événements d'un site sur les N derniers jours (pour agrégation). */
export async function getPixelEvents(siteId: string, days = 30): Promise<PixelEventLite[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      type: pixelEvents.type,
      aiSource: pixelEvents.aiSource,
      actionKind: pixelEvents.actionKind,
      visitorHash: pixelEvents.visitorHash,
      createdAt: pixelEvents.createdAt,
    })
    .from(pixelEvents)
    .where(and(eq(pixelEvents.siteId, siteId), gte(pixelEvents.createdAt, since)))
  return rows
}

/** Anti-flood basique : nombre d'événements pour un site sur la dernière heure. */
export async function countRecentPixelEvents(siteId: string): Promise<number> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [row] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pixelEvents)
    .where(and(eq(pixelEvents.siteId, siteId), gte(pixelEvents.createdAt, hourAgo)))) as [
    { n: number },
  ]
  return row?.n ?? 0
}
