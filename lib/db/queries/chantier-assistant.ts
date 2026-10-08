import { and, asc, desc, eq, gt, gte, isNull, lt, lte, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { chantierAssistantExchanges } from '@/lib/db/schema'

/**
 * Échanges avec l'assistant de l'espace client (lib/chantiers/assistant.ts).
 * Toujours filtrés par chantier : un échange n'est jamais lu hors du sien.
 */

export type AssistantExchangeRow = typeof chantierAssistantExchanges.$inferSelect

interface Slot {
  chantierId: string
  establishmentId: string | null
  fieldKey: string
}

const slotIs = (s: Slot) =>
  and(
    eq(chantierAssistantExchanges.chantierId, s.chantierId),
    s.establishmentId
      ? eq(chantierAssistantExchanges.establishmentId, s.establishmentId)
      : isNull(chantierAssistantExchanges.establishmentId),
    eq(chantierAssistantExchanges.fieldKey, s.fieldKey)
  )

/** Échanges d'une étape, du plus ancien au plus récent (les `limit` derniers). */
export async function loadAssistantExchanges(slot: Slot, limit: number): Promise<AssistantExchangeRow[]> {
  const rows = await db
    .select()
    .from(chantierAssistantExchanges)
    .where(slotIs(slot))
    .orderBy(desc(chantierAssistantExchanges.createdAt))
    .limit(limit)
  return rows.reverse()
}

/** Réponse déjà donnée à la même question sur la même étape (cache). */
export async function findCachedAnswer(slot: Slot, questionKey: string): Promise<string | null> {
  const [row] = await db
    .select({ answer: chantierAssistantExchanges.answer })
    .from(chantierAssistantExchanges)
    .where(and(slotIs(slot), eq(chantierAssistantExchanges.questionKey, questionKey)))
    .orderBy(desc(chantierAssistantExchanges.createdAt))
    .limit(1)
  return row?.answer ?? null
}

export async function insertAssistantExchange(
  values: typeof chantierAssistantExchanges.$inferInsert
): Promise<void> {
  await db.insert(chantierAssistantExchanges).values(values)
}

/** Dépense de l'assistant depuis `since`, tous chantiers confondus, en dollars. */
export async function assistantSpentSince(since: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${chantierAssistantExchanges.costUsd}), 0)` })
    .from(chantierAssistantExchanges)
    .where(gte(chantierAssistantExchanges.createdAt, since))
  return Number(row?.total ?? 0)
}

/** Échanges d'un chantier (vue admin, e-mail groupé), éventuellement dans une fenêtre. */
export async function listAssistantExchangesForChantier(
  chantierId: string,
  window?: { since: Date | null; until: Date }
): Promise<AssistantExchangeRow[]> {
  return db
    .select()
    .from(chantierAssistantExchanges)
    .where(
      and(
        eq(chantierAssistantExchanges.chantierId, chantierId),
        window ? lte(chantierAssistantExchanges.createdAt, window.until) : undefined,
        window?.since ? gt(chantierAssistantExchanges.createdAt, window.since) : undefined
      )
    )
    .orderBy(asc(chantierAssistantExchanges.createdAt))
}

/** Conservation : 30 jours. Renvoie le nombre d'échanges supprimés. */
export async function deleteAssistantExchangesBefore(cutoff: Date): Promise<number> {
  const rows = await db
    .delete(chantierAssistantExchanges)
    .where(lt(chantierAssistantExchanges.createdAt, cutoff))
    .returning({ id: chantierAssistantExchanges.id })
  return rows.length
}
