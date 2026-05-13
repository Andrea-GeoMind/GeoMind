import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { insertContentIssues } from '@/lib/db/queries/content-issues'
import { computeContentScore } from '@/lib/analysis/scoring'
import type { ContentRuleFn, ContentIssue, FirecrawlPage } from './types'

import { checkThinContent } from './rules/thin-content'
import { checkMetaDescriptionMissing } from './rules/meta-description-missing'
import { checkMetaDescriptionTooShort } from './rules/meta-description-too-short'
import { checkDuplicateMetaDescriptions } from './rules/duplicate-meta-descriptions'
import { checkTitleMissingOrShort } from './rules/title-missing-or-short'
import { checkNoStructuredLists } from './rules/no-structured-lists'
import { checkNoFaqContent } from './rules/no-faq-content'
import { checkLowPageCount } from './rules/low-page-count'
import { checkNoDatesInContent } from './rules/no-dates-in-content'
import { checkNoDefinitionPatterns } from './rules/no-definition-patterns'

export type { ContentIssue, FirecrawlPage } from './types'

const RULES: ContentRuleFn[] = [
  checkThinContent,
  checkMetaDescriptionMissing,
  checkMetaDescriptionTooShort,
  checkDuplicateMetaDescriptions,
  checkTitleMissingOrShort,
  checkNoStructuredLists,
  checkNoFaqContent,
  checkLowPageCount,
  checkNoDatesInContent,
  checkNoDefinitionPatterns,
]

export interface ContentAnalysisInput {
  siteId: string
  analysisId: string
}

export interface ContentAnalysisResult {
  score: number
  issueCount: number
}

export async function runContentAnalysis({
  siteId,
  analysisId,
}: ContentAnalysisInput): Promise<ContentAnalysisResult> {
  const [site, dbPages] = await Promise.all([
    getSiteById(siteId),
    getFirecrawlPagesBySiteId(siteId),
  ])

  if (!site) throw new Error(`Site not found: ${siteId}`)

  const pages: FirecrawlPage[] = dbPages.map((p) => ({
    url: p.url,
    markdown: p.markdown,
    statusCode: p.statusCode,
    metadata: p.metadata as unknown as FirecrawlPage['metadata'],
  }))

  const ruleInput = { pages, siteUrl: site.url }

  const results = await Promise.all(RULES.map((rule) => rule(ruleInput)))
  const issues = results.filter((r): r is ContentIssue => r !== null)

  if (issues.length > 0) {
    await insertContentIssues(
      issues.map((issue) => ({
        analysisId,
        ruleKey: issue.ruleKey,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        sampleUrls: issue.sampleUrls,
        penalty: issue.penalty,
      }))
    )
  }

  const score = computeContentScore(issues.map((i) => i.penalty))
  return { score, issueCount: issues.length }
}
