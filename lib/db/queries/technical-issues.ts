import { db } from '@/lib/db/client'
import { technicalIssues } from '@/lib/db/schema'

type TechnicalIssueCategoryEnum = 'accessibility' | 'structure' | 'schema_org' | 'performance'

export interface TechnicalIssueInsert {
  analysisId: string
  ruleKey: string
  category: TechnicalIssueCategoryEnum
  title: string
  description: string
  sampleUrls: string[]
  penalty: number
}

export async function insertTechnicalIssues(issues: TechnicalIssueInsert[]) {
  if (issues.length === 0) return []
  return db.insert(technicalIssues).values(issues).returning()
}
