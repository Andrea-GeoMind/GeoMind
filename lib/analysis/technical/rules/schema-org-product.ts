import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

const PRODUCT_URL_PATTERNS = ['/produit/', '/product/', '/shop/', '/boutique/', '/catalogue/']

function isProductPage(page: FirecrawlPage): boolean {
  return PRODUCT_URL_PATTERNS.some((p) => page.url.includes(p))
}

export async function checkSchemaOrgProduct({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const productPages = pages.filter(isProductPage)
  if (productPages.length === 0) return null
  const missingSchema = productPages.filter((p) => !getSchemaTypes(p).includes('Product'))
  if (missingSchema.length === 0) return null
  return {
    ruleKey: 'schema_org_product',
    category: 'schema_org',
    title: 'Schema Product manquant',
    description: `${missingSchema.length} page(s) produit n'ont pas de schema.org Product. Ce schema est essentiel pour la visibilité dans les IAs sur les requêtes e-commerce.`,
    sampleUrls: missingSchema.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
