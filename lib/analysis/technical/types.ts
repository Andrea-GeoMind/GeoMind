import type { IssueSeverity, IssueEffort, IssueImpact } from '@/lib/analysis/geo-rules'

export type { IssueSeverity, IssueEffort, IssueImpact }

export type TechnicalIssueCategoryEnum = 'accessibility' | 'structure' | 'schema_org' | 'performance'

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

export interface TechnicalIssue {
  ruleKey: string
  category: TechnicalIssueCategoryEnum
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
}

/** Règle à scope site : reçoit toutes les pages, émet au plus une issue globale. */
export type TechnicalRuleFn = (input: RuleInput) => Promise<TechnicalIssue | null>

/** Règle à scope page : exécutée sur chaque page sélectionnée (§18.2). */
export type TechnicalPageRuleFn = (
  page: FirecrawlPage,
  input: RuleInput
) => Promise<TechnicalIssue | null>
