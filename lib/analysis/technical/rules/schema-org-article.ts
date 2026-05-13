import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

const ARTICLE_URL_PATTERNS = ['/blog/', '/article/', '/actu/', '/news/', '/post/', '/actualite/']
const ARTICLE_SCHEMA_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle'])

function isArticlePage(page: FirecrawlPage): boolean {
  return ARTICLE_URL_PATTERNS.some((p) => page.url.includes(p))
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
    penalty: 4,
  }
}
