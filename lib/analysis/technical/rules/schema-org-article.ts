import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'
import { isArticleUrl } from '@/lib/analysis/url-helpers'

const ARTICLE_SCHEMA_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle'])

function isArticlePage(page: FirecrawlPage): boolean {
  return isArticleUrl(page.url)
}

export async function checkSchemaOrgArticle({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const articlePages = pages.filter(isArticlePage)
  if (articlePages.length === 0) return null
  const missingSchema = articlePages.filter(
    (p) => !getSchemaTypes(p).some((t) => ARTICLE_SCHEMA_TYPES.has(t))
  )
  if (missingSchema.length === 0) return null
  return {
    ruleKey: 'schema_org_article',
    category: 'schema_org',
    title: 'Schema Article manquant',
    description: `${missingSchema.length} page(s) de blog/actualité n'ont pas de schema.org Article ou BlogPosting. Ce schema aide les IAs à identifier et citer votre contenu éditorial.`,
    sampleUrls: missingSchema.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
