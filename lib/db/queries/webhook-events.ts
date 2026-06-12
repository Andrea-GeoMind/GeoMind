/**
 * lib/db/queries/webhook-events.ts
 *
 * Idempotence des webhooks Stripe (PLAN item 6). Stripe rejoue les événements
 * (retries, incidents) avec le même event id : on ne traite chaque id qu'une
 * fois. Claim avant traitement, libération en cas d'échec pour laisser le
 * retry Stripe reprocesser.
 */

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { stripeWebhookEvents } from '@/lib/db/schema'

/**
 * Tente de réclamer l'événement. Retourne false si un traitement (concurrent
 * ou passé) l'a déjà réclamé — l'appelant doit alors ignorer l'événement.
 */
export async function claimWebhookEvent(eventId: string, type: string): Promise<boolean> {
  const inserted = await db
    .insert(stripeWebhookEvents)
    .values({ id: eventId, type })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id })
  return inserted.length > 0
}

/** Libère un claim après échec de traitement, pour permettre le retry Stripe. */
export async function releaseWebhookEvent(eventId: string): Promise<void> {
  await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, eventId))
}
