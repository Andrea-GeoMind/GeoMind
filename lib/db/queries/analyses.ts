import { and, count, desc, eq, gte, ne } from 'drizzle-orm'
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

export async function updateAnalysisTechnicalScore(id: string, technicalScore: number) {
  const [row] = await db
    .update(analyses)
    .set({ technicalScore, updatedAt: new Date() })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

export async function updateAnalysisContentScore(id: string, contentScore: number) {
  const [row] = await db
    .update(analyses)
    .set({ contentScore, updatedAt: new Date() })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

export interface AnalysisScores {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

// Persists all 4 scores and atomically marks the analysis as success.
export async function updateAnalysisScores(id: string, scores: AnalysisScores) {
  const [row] = await db
    .update(analyses)
    .set({
      ...scores,
      status: 'success',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

// Returns the most recent analysis for a site regardless of status.
// Used to detect whether an analysis is in progress.
export async function getLatestAnalysis(siteId: string) {
  const [row] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.siteId, siteId))
    .orderBy(desc(analyses.createdAt))
    .limit(1)
  return row ?? null
}

// Returns the N most recent analyses with status='success' for a site.
// Pass limit=2 to get current + previous for delta computation.
export async function getLatestSuccessfulAnalyses(siteId: string, limit: number) {
  return db
    .select()
    .from(analyses)
    .where(and(eq(analyses.siteId, siteId), eq(analyses.status, 'success')))
    .orderBy(desc(analyses.createdAt))
    .limit(limit)
}

// Counts all non-error analyses ever (for free plan lifetime limit).
export async function countAllAnalyses(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(analyses)
    .where(and(eq(analyses.userId, userId), ne(analyses.status, 'error')))
  return result?.value ?? 0
}

// Excludes `error` rows: a failed analysis must not count against the monthly quota.
export async function countAnalysesThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [result] = await db
    .select({ value: count() })
    .from(analyses)
    .where(
      and(
        eq(analyses.userId, userId),
        gte(analyses.createdAt, startOfMonth),
        ne(analyses.status, 'error')
      )
    )

  return result?.value ?? 0
}
