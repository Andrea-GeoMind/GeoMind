import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { insertTechnicalIssues } from '@/lib/db/queries/technical-issues'
import { computeIssuesScore } from '@/lib/analysis/scoring'
import { penaltyForSeverity } from '@/lib/analysis/geo-rules'
import { selectPagesForAnalysis } from '@/lib/analysis/page-selection'
import { analysablePages } from '@/lib/analysis/page-health'
import { crawlWasTruncated } from '@/lib/analysis/crawl-coverage'
import { completeTechnicalOpportunities } from '@/lib/analysis/opportunities'
import { hasFaqContent } from '@/lib/analysis/faq-detection'
import { getPageAnalysisLimit } from '@/lib/quotas'
import type { TechnicalRuleFn, TechnicalPageRuleFn, TechnicalIssue, FirecrawlPage } from './types'

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
]

export interface TechnicalAnalysisInput {
  siteId: string
  analysisId: string
}

export interface TechnicalAnalysisResult {
  score: number
  issueCount: number
}

/**
 * Évaluation pure des règles techniques — aucune lecture ni écriture en base.
 *
 * Le calcul n'a jamais eu besoin de la base : il prend des pages et une URL, et
 * rend un score et des points faibles. L'extraire permet de l'exécuter sur un
 * site hors base — la prospection (scripts/prospection) audite des sites qui ne
 * sont pas des clients et ne doit créer ni site, ni analyse, ni issue.
 *
 * `runTechnicalAnalysis` garde ses lectures/écritures autour de cet appel.
 * Aucun appel LLM : uniquement les règles déterministes.
 */
export interface TechnicalRuleEvaluation {
  score: number
  /** Détectés, hors opportunités (qui ne pénalisent pas). */
  issues: TechnicalIssue[]
  /** Détectés + opportunités, tels que persistés par la production. */
  allIssues: TechnicalIssue[]
  pagesAnalysed: number
}

export async function evaluateTechnicalRules(
  pages: FirecrawlPage[],
  siteUrl: string,
  pageLimit: number
): Promise<TechnicalRuleEvaluation> {
  const ruleInput = { pages, siteUrl, crawlTruncated: crawlWasTruncated(pages) }

  const siteResults = await Promise.all(SITE_RULES.map((rule) => rule(ruleInput)))
  const siteIssues = siteResults.filter((r): r is TechnicalIssue => r !== null)

  // Les pages dont le scrape a échoué sont écartées : leurs métadonnées vides
  // feraient remonter de faux points faibles (cf. lib/analysis/page-health.ts).
  const selectedPages = selectPagesForAnalysis(analysablePages(pages), pageLimit)
  const pageIssues: TechnicalIssue[] = []
  for (const page of selectedPages) {
    const results = await Promise.all(PAGE_RULES.map((rule) => rule(page, ruleInput)))
    for (const issue of results) {
      if (issue) pageIssues.push({ ...issue, pageUrl: page.url })
    }
  }

  const issues = [...siteIssues, ...pageIssues]
  // La preuve positive que la règle seule ne donne pas : schema_org_faq ne
  // tire pas aussi bien quand la FAQ est balisée que quand il n'y a pas de
  // FAQ du tout.
  const allIssues = [
    ...issues,
    ...completeTechnicalOpportunities(issues, { faqExists: hasFaqContent(pages) }),
  ]

  const score = computeIssuesScore(
    allIssues.map((i) => ({
      ruleKey: i.ruleKey,
      category: i.category,
      penalty: penaltyForSeverity(i.severity),
      pageUrl: i.pageUrl ?? null,
    })),
    Math.max(1, selectedPages.length)
  )

  return { score, issues, allIssues, pagesAnalysed: selectedPages.length }
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

  // Pages analysées selon le plan (§18.2)
  const pageLimit = await getPageAnalysisLimit(site.userId)
  const {
    score,
    issues: detected,
    allIssues,
  } = await evaluateTechnicalRules(pages, site.url, pageLimit)

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

  // issueCount n'inclut pas les opportunités (elles ne pénalisent pas)
  return { score, issueCount: detected.length }
}
