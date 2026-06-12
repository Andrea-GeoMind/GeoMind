import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { contentIssues } from '@/lib/db/schema'

type ContentIssueCategoryEnum = 'readability' | 'metadata' | 'structure' | 'coverage'

export interface ContentIssueInsert {
  analysisId: string
  ruleKey: string
  category: ContentIssueCategoryEnum
  title: string
  description: string
  sampleUrls: string[]
  penalty: number
  severity: 'major' | 'moderate' | 'minor' | 'opportunity'
  effort: number
  impact: number
  pageUrl?: string | null
}

export async function insertContentIssues(issues: ContentIssueInsert[]) {
  if (issues.length === 0) return []
  return db.insert(contentIssues).values(issues).returning()
}

export async function getContentIssuesByAnalysisId(analysisId: string) {
  return db
    .select()
    .from(contentIssues)
    .where(eq(contentIssues.analysisId, analysisId))
    .orderBy(desc(contentIssues.penalty))
}
