import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { insertContentIssues } from '@/lib/db/queries/content-issues'
import { computeIssuesScore } from '@/lib/analysis/scoring'
import { penaltyForSeverity } from '@/lib/analysis/geo-rules'
import { selectPagesForAnalysis } from '@/lib/analysis/page-selection'
import { completeContentOpportunities } from '@/lib/analysis/opportunities'
import { getPageAnalysisLimit } from '@/lib/quotas'
import type { ContentRuleFn, ContentPageRuleFn, ContentIssue, FirecrawlPage } from './types'

// ── Règles à scope SITE (une issue globale au plus) ───────────────────────────
import { checkThinContent } from './rules/thin-content'
import { checkNoFaqContent } from './rules/no-faq-content'
import { checkNoDatesInContent } from './rules/no-dates-in-content'
import { checkNoDefinitionPatterns } from './rules/no-definition-patterns'
import { checkNoStructuredLists } from './rules/no-structured-lists'
import { checkLowPageCount } from './rules/low-page-count'
// Réintégrée V2 (§18.5) — title/meta nourrissent les snippets de citation des IA
import { checkDuplicateMetaDescriptions } from './rules/duplicate-meta-descriptions'
// Nouvelles V2
import { checkShortAverageWordCount } from './rules/short-average-word-count'
import { checkNoStatisticsOrFigures } from './rules/no-statistics-or-figures'
import { checkNoExternalCitations } from './rules/no-external-citations'
import { checkContentNotFresh } from './rules/content-not-fresh'
import { checkNoNamedEntities } from './rules/no-named-entities'
import { checkDuplicateContentCrossPages } from './rules/duplicate-content-cross-pages'
import { checkNoComparativeContent } from './rules/no-comparative-content'
import { checkAboutPageMissing } from './rules/about-page-missing'
import { checkContactInfoMissing } from './rules/contact-info-missing'

// ── Règles à scope PAGE (exécutées sur chaque page sélectionnée, §18.2) ──────
import { checkTitleMissingOrShort } from './rules/title-missing-or-short'
import { checkMetaDescriptionMissing } from './rules/meta-description-missing'
import { checkMetaDescriptionTooShort } from './rules/meta-description-too-short'
import { checkFirstParagraphNoAnswer } from './rules/first-paragraph-no-answer'
import { checkNoAuthorBio } from './rules/no-author-bio'
import { checkHeadingsTooShort } from './rules/headings-too-short'
import { checkPoorSentenceLength } from './rules/poor-sentence-length'
import { checkKeywordNotInHeadings } from './rules/keyword-not-in-headings'
import { checkNoConclusionOrSummary } from './rules/no-conclusion-or-summary'
import { checkNoTableOfContents } from './rules/no-table-of-contents'

export type { ContentIssue, FirecrawlPage } from './types'

const SITE_RULES: ContentRuleFn[] = [
  checkThinContent,
  checkNoFaqContent,
  checkNoDatesInContent,
  checkNoDefinitionPatterns,
  checkNoStructuredLists,
  checkLowPageCount,
  checkDuplicateMetaDescriptions,
  checkShortAverageWordCount,
  checkNoStatisticsOrFigures,
  checkNoExternalCitations,
  checkContentNotFresh,
  checkNoNamedEntities,
  checkDuplicateContentCrossPages,
  checkNoComparativeContent,
  checkAboutPageMissing,
  checkContactInfoMissing,
]

const PAGE_RULES: ContentPageRuleFn[] = [
  checkTitleMissingOrShort,
  checkMetaDescriptionMissing,
  checkMetaDescriptionTooShort,
  checkFirstParagraphNoAnswer,
  checkNoAuthorBio,
  checkHeadingsTooShort,
  checkPoorSentenceLength,
  checkKeywordNotInHeadings,
  checkNoConclusionOrSummary,
  checkNoTableOfContents,
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
  const [site, dbPages, metadata] = await Promise.all([
    getSiteById(siteId),
    getFirecrawlPagesBySiteId(siteId),
    getSiteMetadataBySiteId(siteId),
  ])

  if (!site) throw new Error(`Site not found: ${siteId}`)

  const pages: FirecrawlPage[] = dbPages.map((p) => ({
    url: p.url,
    markdown: p.markdown,
    statusCode: p.statusCode,
    metadata: p.metadata as unknown as FirecrawlPage['metadata'],
  }))

  const ruleInput = { pages, siteUrl: site.url, keywords: metadata?.keywords ?? [] }

  // 1. Règles site
  const siteResults = await Promise.all(SITE_RULES.map((rule) => rule(ruleInput)))
  const siteIssues = siteResults.filter((r): r is ContentIssue => r !== null)

  // 2. Règles page — sur les pages sélectionnées selon le plan (§18.2)
  const pageLimit = await getPageAnalysisLimit(site.userId)
  const selectedPages = selectPagesForAnalysis(pages, pageLimit)
  const pageIssues: ContentIssue[] = []
  for (const page of selectedPages) {
    const results = await Promise.all(PAGE_RULES.map((rule) => rule(page, ruleInput)))
    for (const issue of results) {
      if (issue) pageIssues.push({ ...issue, pageUrl: page.url })
    }
  }

  // 3. Opportunités — garantie ≥ 3 « pour aller plus loin » (§18.6)
  const detected = [...siteIssues, ...pageIssues]
  const opportunities = completeContentOpportunities(detected)
  const allIssues = [...detected, ...opportunities]

  if (allIssues.length > 0) {
    await insertContentIssues(
      allIssues.map((issue) => ({
        analysisId,
        ruleKey: issue.ruleKey,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        sampleUrls: issue.sampleUrls,
        penalty: penaltyForSeverity(issue.severity),
        severity: issue.severity,
        effort: issue.effort,
        impact: issue.impact,
        pageUrl: issue.pageUrl ?? null,
      }))
    )
  }

  // 4. Score V2 (§18.3)
  const score = computeIssuesScore(
    allIssues.map((i) => ({
      ruleKey: i.ruleKey,
      category: i.category,
      penalty: penaltyForSeverity(i.severity),
      pageUrl: i.pageUrl ?? null,
    })),
    Math.max(1, selectedPages.length)
  )

  return { score, issueCount: detected.length }
}
