import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { insertTechnicalIssues } from '@/lib/db/queries/technical-issues'
import { computeTechnicalScore } from '@/lib/analysis/scoring'
import type { TechnicalRuleFn, TechnicalIssue, FirecrawlPage } from './types'

// ── Règles GEO-critiques (accessibilité aux crawlers IA + données structurées) ──
import { checkHttpsMissing } from './rules/https-missing'
import { checkRobotsTxtBlockAll } from './rules/robots-txt-block-all'
import { checkRobotsTxtBlockAiBots } from './rules/robots-txt-block-ai-bots'
import { checkLlmsTxtMissing } from './rules/llms-txt-missing'
import { checkSitemapMissing } from './rules/sitemap-missing'
import { checkSitemapMalformed } from './rules/sitemap-malformed'
import { checkSchemaOrgOrganization } from './rules/schema-org-organization'
import { checkSchemaOrgFaq } from './rules/schema-org-faq'
import { checkSchemaOrgArticle } from './rules/schema-org-article'
import { checkSchemaOrgProduct } from './rules/schema-org-product'

// Règles retirées (SEO classique, aucun impact direct sur les citations IA) :
// - checkH1MissingOrDuplicate   → structure HTML, pas GEO
// - checkHierarchyMissing       → structure HTML, pas GEO
// - checkDepthTooDeep           → URL, pas GEO
// - checkResponseTimeSlow       → performance, pas GEO
// - checkPageSizeHeavy          → performance, pas GEO
// - checkHttpErrorsRatio        → erreurs HTTP, impact indirect trop faible

export type { TechnicalIssue, FirecrawlPage } from './types'

const RULES: TechnicalRuleFn[] = [
  checkHttpsMissing,
  checkRobotsTxtBlockAll,
  checkRobotsTxtBlockAiBots,
  checkLlmsTxtMissing,
  checkSitemapMissing,
  checkSitemapMalformed,
  checkSchemaOrgOrganization,
  checkSchemaOrgFaq,
  checkSchemaOrgArticle,
  checkSchemaOrgProduct,
]

export interface TechnicalAnalysisInput {
  siteId: string
  analysisId: string
}

export interface TechnicalAnalysisResult {
  score: number
  issueCount: number
}

export async function runTechnicalAnalysis({
  siteId,
  analysisId,
}: TechnicalAnalysisInput): Promise<TechnicalAnalysisResult> {
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
  const issues = results.filter((r): r is TechnicalIssue => r !== null)

  if (issues.length > 0) {
    await insertTechnicalIssues(
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

  const score = computeTechnicalScore(issues.map((i) => i.penalty))
  return { score, issueCount: issues.length }
}
