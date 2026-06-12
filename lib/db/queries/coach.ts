import { and, asc, desc, count, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { coachMessages, coachMemory } from '@/lib/db/schema'

export type CoachMessageInsert = {
  siteId: string
  analysisId: string | null
  userId: string
  role: 'user' | 'assistant'
  content: string
}

export async function insertCoachMessage(data: CoachMessageInsert) {
  const [row] = await db.insert(coachMessages).values(data).returning()
  return row!
}

export async function getCoachMessages(siteId: string, analysisId: string, limit = 50) {
  return db
    .select()
    .from(coachMessages)
    .where(and(eq(coachMessages.siteId, siteId), eq(coachMessages.analysisId, analysisId)))
    .orderBy(asc(coachMessages.createdAt))
    .limit(limit)
}

export async function countCoachMessagesThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [result] = await db
    .select({ value: count() })
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.userId, userId),
        eq(coachMessages.role, 'user'),
        gte(coachMessages.createdAt, startOfMonth)
      )
    )
  return result?.value ?? 0
}

// ─── Mémoire de GEO (§16.8) ───────────────────────────────────────────────────

export async function getCoachMemory(userId: string, siteId: string) {
  const [row] = await db
    .select()
    .from(coachMemory)
    .where(and(eq(coachMemory.userId, userId), eq(coachMemory.siteId, siteId)))
  return row ?? null
}

export async function upsertCoachMemory(data: {
  userId: string
  siteId: string
  memorySummary: string
  messageCount: number
}) {
  await db
    .insert(coachMemory)
    .values({ ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [coachMemory.userId, coachMemory.siteId],
      set: {
        memorySummary: data.memorySummary,
        messageCount: data.messageCount,
        updatedAt: new Date(),
      },
    })
}

/** Les N derniers messages du site (toutes analyses confondues) — pour recharger
 *  la conversation au mount (§16.8). Retournés en ordre chronologique. */
export async function getRecentCoachMessages(userId: string, siteId: string, limit = 20) {
  const rows = await db
    .select()
    .from(coachMessages)
    .where(and(eq(coachMessages.userId, userId), eq(coachMessages.siteId, siteId)))
    .orderBy(desc(coachMessages.createdAt))
    .limit(limit)
  return rows.reverse()
}

/** Nombre total de messages user pour ce site — déclencheur de compression (§16.8). */
export async function countUserMessagesForSite(userId: string, siteId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.userId, userId),
        eq(coachMessages.siteId, siteId),
        eq(coachMessages.role, 'user')
      )
    )
  return result?.value ?? 0
}

/** Rate limit anti-abus : messages user de la dernière heure (§16.9 — max 30/h). */
export async function countCoachMessagesLastHour(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [result] = await db
    .select({ value: count() })
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.userId, userId),
        eq(coachMessages.role, 'user'),
        gte(coachMessages.createdAt, oneHourAgo)
      )
    )
  return result?.value ?? 0
}

/** RGPD : « Effacer la mémoire de GEO » — supprime messages + résumé du site (§16.8). */
export async function clearCoachData(userId: string, siteId: string): Promise<void> {
  await db
    .delete(coachMessages)
    .where(and(eq(coachMessages.userId, userId), eq(coachMessages.siteId, siteId)))
  await db
    .delete(coachMemory)
    .where(and(eq(coachMemory.userId, userId), eq(coachMemory.siteId, siteId)))
}

/** Transcript brut pour la compression mémoire (Inngest). */
export async function getCoachTranscript(userId: string, siteId: string, limit = 40) {
  const rows = await db
    .select({ role: coachMessages.role, content: coachMessages.content })
    .from(coachMessages)
    .where(and(eq(coachMessages.userId, userId), eq(coachMessages.siteId, siteId)))
    .orderBy(desc(coachMessages.createdAt))
    .limit(limit)
  return rows.reverse()
}
