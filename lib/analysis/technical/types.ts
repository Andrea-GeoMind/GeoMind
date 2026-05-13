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
  penalty: number
}

export interface RuleInput {
  pages: FirecrawlPage[]
  siteUrl: string
}

export type TechnicalRuleFn = (input: RuleInput) => Promise<TechnicalIssue | null>
