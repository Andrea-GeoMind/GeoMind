import { db } from '@/lib/db/client'
import { recommendations } from '@/lib/db/schema'
import type { InferInsertModel } from 'drizzle-orm'

export type RecommendationInsertRow = InferInsertModel<typeof recommendations>

export async function insertRecommendations(rows: RecommendationInsertRow[]) {
  if (rows.length === 0) return []
  return db.insert(recommendations).values(rows).onConflictDoNothing().returning()
}

export async function getRecommendationByIssueId(issueId: string, variant = 'simplified') {
  return db.query.recommendations.findFirst({
    where: (r, { and, eq }) => and(eq(r.issueId, issueId), eq(r.variant, variant)),
  })
}
