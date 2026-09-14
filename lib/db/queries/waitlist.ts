import { db } from '@/lib/db/client'
import { waitlistSignups } from '@/lib/db/schema'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Inscrit un email sur la liste d'attente d'un plan. Idempotent :
 * un doublon (email, plan) est ignoré silencieusement.
 */
export async function addToWaitlist(data: {
  email: string
  plan: string
  source: string
  userId?: string
}) {
  await db
    .insert(waitlistSignups)
    .values(data)
    .onConflictDoNothing({
      target: [waitlistSignups.email, waitlistSignups.plan],
    })
}
