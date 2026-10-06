/**
 * lib/db/queries/rate-limits.ts
 *
 * Compteur atomique de lib/rate-limit.ts : un upsert par requête, qui renvoie
 * le total de la fenêtre courante. Les fenêtres de plus d'un jour sont
 * purgées de temps en temps, au passage, pour que la table reste petite.
 */

import { lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { rateLimits } from '@/lib/db/schema'
import { rateLimitVerdict, windowStartFor, type RateLimitRule, type RateLimitVerdict } from '@/lib/rate-limit'

const PURGE_PROBABILITY = 0.01
const PURGE_OLDER_THAN_MS = 24 * 60 * 60 * 1000

export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now: Date = new Date()
): Promise<RateLimitVerdict> {
  const windowStart = windowStartFor(now, rule.windowSeconds)
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count })

  if (Math.random() < PURGE_PROBABILITY) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(now.getTime() - PURGE_OLDER_THAN_MS)))
  }

  return rateLimitVerdict(row?.count ?? 1, rule, now)
}
