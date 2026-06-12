import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { insertTechnicalIssues } from '@/lib/db/queries/technical-issues'
import { computeIssuesScore } from '@/lib/analysis/scoring'
import { penaltyForSeverity } from '@/lib/analysis/geo-rules'
import { selectPagesForAnalysis } from '@/lib/analysis/page-selection'
import { completeTechnicalOpportunities } from '@/lib/analysis/opportunities'
import { getPageAnalysisLimit } from '@/lib/quotas'
import type {
  TechnicalRuleFn,
  TechnicalPageRuleFn,
  TechnicalIssue,
  FirecrawlPage,
} from './types'

// ── Règles à scope SITE (une issue globale au plus) ───────────────────────────
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
// Réintégrées V2 (§18.4) — les crawlers IA parsent la structure HTML et
// échouent sur les pages lentes ; leur retrait V1 était une sur-correction.
import { checkDepthTooDeep } from './rules/depth-too-deep'
import { checkResponseTimeSlow } from './rules/response-time-slow'
import { checkHttpErrorsRatio } from './rules/http-errors-ratio'
// Nouvelles V2
import { checkBrokenInternalLinks } from './rules/broken-internal-links'
import { checkPaginationMissing } from './rules/pagination-missing'

// ── Règles à scope PAGE (exécutées sur chaque page sélectionnée, §18.2) ──────
import { checkH1MissingOrDuplicate } from './rules/h1-missing-or-duplicate'
import { checkHierarchyMissing } from './rules/hierarchy-missing'
import { checkPageSizeHeavy } from './rules/page-size-heavy'
import { checkCanonicalMissing } from './rules/canonical-missing'
import { checkOpenGraphMissing } from './rules/open-graph-missing'
import { checkTwitterCardMissing } from './rules/twitter-card-missing'
import { checkHtmlLangMissing } from './rules/html-lang-missing'
import { checkMobileViewportMissing } from './rules/mobile-viewport-missing'
import { checkNoindexOnKeyPages } from './rules/noindex-on-key-pages'
import { checkImagesWithoutAlt } from './rules/images-without-alt'
import { checkUrlNotReadable } from './rules/url-not-readable'
import { checkUrlTooLong } from './rules/url-too-long'
import { checkNoBreadcrumbSchema } from './rules/no-breadcrumb-schema'
import { checkNoAuthorSchema } from './rules/no-author-schema'
import { checkNoHowToSchema } from './rules/no-how-to-schema'
import { checkSemanticHtml5Missing } from './rules/semantic-html5-missing'

export type { TechnicalIssue, FirecrawlPage } from './types'

const SITE_RULES: TechnicalRuleFn[] = [
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
  checkDepthTooDeep,
  checkResponseTimeSlow,
  checkHttpErrorsRatio,
  checkBrokenInternalLinks,
  checkPaginationMissing,
]

const PAGE_RULES: TechnicalPageRuleFn[] = [
  checkH1MissingOrDuplicate,
  checkHierarchyMissing,
  checkPageSizeHeavy,
  checkCanonicalMissing,
  checkOpenGraphMissing,
  checkTwitterCardMissing,
  checkHtmlLangMissing,
  checkMobileViewportMissing,
  checkNoindexOnKeyPages,
  checkImagesWithoutAlt,
  checkUrlNotReadable,
  checkUrlTooLong,
  checkNoBreadcrumbSchema,
  checkNoAuthorSchema,
  checkNoHowToSchema,
  checkSemanticHtml5Missing,
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

  // 1. Règles site
  const siteResults = await Promise.all(SITE_RULES.map((rule) => rule(ruleInput)))
  const siteIssues = siteResults.filter((r): r is TechnicalIssue => r !== null)

  // 2. Règles page — sur les pages sélectionnées selon le plan (§18.2)
  const pageLimit = await getPageAnalysisLimit(site.userId)
  const selectedPages = selectPagesForAnalysis(pages, pageLimit)
  const pageIssues: TechnicalIssue[] = []
  for (const page of selectedPages) {
    const results = await Promise.all(PAGE_RULES.map((rule) => rule(page, ruleInput)))
    for (const issue of results) {
      if (issue) pageIssues.push({ ...issue, pageUrl: page.url })
    }
  }

  // 3. Opportunités — garantie ≥ 3 « pour aller plus loin » (§18.6)
  const detected = [...siteIssues, ...pageIssues]
  const opportunities = completeTechnicalOpportunities(detected)
  const allIssues = [...detected, ...opportunities]

  if (allIssues.length > 0) {
    await insertTechnicalIssues(
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

  // 4. Score V2 : sévérités + proportionnalité page + plafonds par catégorie (§18.3)
  const score = computeIssuesScore(
    allIssues.map((i) => ({
      ruleKey: i.ruleKey,
      category: i.category,
      penalty: penaltyForSeverity(i.severity),
      pageUrl: i.pageUrl ?? null,
    })),
    Math.max(1, selectedPages.length)
  )

  // issueCount n'inclut pas les opportunités (elles ne pénalisent pas)
  return { score, issueCount: detected.length }
}
