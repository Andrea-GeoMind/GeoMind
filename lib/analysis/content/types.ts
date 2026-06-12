import type { IssueSeverity, IssueEffort, IssueImpact } from '@/lib/analysis/geo-rules'

export type { IssueSeverity, IssueEffort, IssueImpact }

export type ContentIssueCategoryEnum = 'readability' | 'metadata' | 'structure' | 'coverage'

export interface FirecrawlPageMetadata {
  title?: string
  description?: string
  url?: string
  language?: string
  statusCode?: number
  h1?: string | string[]
  h2?: string[]
  schemaOrgs?: Array<Record<string, unknown>>
  loadTime?: number
  [key: string]: unknown
}

export interface FirecrawlPage {
  url: string
  markdown?: string | null
  statusCode?: number | null
  metadata?: FirecrawlPageMetadata | null
}

export interface ContentIssue {
  ruleKey: string
  category: ContentIssueCategoryEnum
  title: string
  description: string
  sampleUrls: string[]
  /** Sévérité V2 (§18) — la pénalité est dérivée via SEVERITY_PENALTIES */
  severity: IssueSeverity
  /** 1 = quick win (< 30 min), 3 = chantier */
  effort: IssueEffort
  /** Impact GEO estimé : 1 = marginal, 3 = déterminant */
  impact: IssueImpact
  /** Renseigné par le runner pour les règles à scope page */
  pageUrl?: string | null
}

export interface RuleInput {
  pages: FirecrawlPage[]
  siteUrl: string
  /** Mots-clés cibles du site (site_metadata) — pour keyword-not-in-headings */
  keywords?: string[]
}

/** Règle à scope site : reçoit toutes les pages, émet au plus une issue globale. */
export type ContentRuleFn = (input: RuleInput) => Promise<ContentIssue | null>

/** Règle à scope page : exécutée sur chaque page sélectionnée (§18.2). */
export type ContentPageRuleFn = (
  page: FirecrawlPage,
  input: RuleInput
) => Promise<ContentIssue | null>
