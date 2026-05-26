import { and, asc, count, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { coachMessages } from '@/lib/db/schema'

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
