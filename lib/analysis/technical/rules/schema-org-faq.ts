import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

function isFaqPage(page: FirecrawlPage): boolean {
  const questionHeadings = page.markdown?.match(/^#{1,4}.+\?/gm) ?? []
  return questionHeadings.length >= 3
}

export async function checkSchemaOrgFaq({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const faqPages = pages.filter(isFaqPage)
  if (faqPages.length === 0) return null
  const missingSchema = faqPages.filter((p) => !getSchemaTypes(p).includes('FAQPage'))
  if (missingSchema.length === 0) return null
  return {
    ruleKey: 'schema_org_faq',
    category: 'schema_org',
    title: 'Schema FAQPage manquant',
    description: `${missingSchema.length} page(s) de type FAQ n'ont pas de schema.org FAQPage. Ce schema améliore significativement la visibilité dans les réponses IA.`,
    sampleUrls: missingSchema.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
