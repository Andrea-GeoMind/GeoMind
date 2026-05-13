import { and, count, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { analyses } from '@/lib/db/schema'

export type AnalysisInsert = {
  siteId: string
  userId: string
}

export type AnalysisStatus = 'pending' | 'running' | 'success' | 'error'

export async function createAnalysis(data: AnalysisInsert) {
  const [row] = await db.insert(analyses).values(data).returning()
  return row
}

export async function getAnalysisById(id: string) {
  return db.query.analyses.findFirst({ where: eq(analyses.id, id) })
}

export async function getAnalysesBySiteId(siteId: string) {
  return db.select().from(analyses).where(eq(analyses.siteId, siteId)).orderBy(desc(analyses.createdAt))
}

export async function updateAnalysisStatus(
  id: string,
  status: AnalysisStatus,
  errorMessage?: string
) {
  const [row] = await db
    .update(analyses)
    .set({
      status,
      errorMessage: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

export async function updateAnalysisAuthorityScore(id: string, authorityScore: number) {
  const [row] = await db
    .update(analyses)
    .set({ authorityScore, updatedAt: new Date() })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

// Nombre d'analyses lancées ce mois-ci pour un user (pour vérif quota).
export async function countAnalysesThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [result] = await db
    .select({ value: count() })
    .from(analyses)
    .where(and(eq(analyses.userId, userId), gte(analyses.createdAt, startOfMonth)))

  return result?.value ?? 0
}
