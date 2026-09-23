import type { TechnicalIssue, RuleInput } from '../types'
import { getSchemaTypes } from '@/lib/analysis/schema-helpers'
import { faqPages } from '@/lib/analysis/faq-detection'

/**
 * Règle — des pages de questions/réponses existent mais ne déclarent pas le
 * balisage FAQPage.
 *
 * La détection des pages FAQ est partagée (lib/analysis/faq-detection.ts) avec
 * la règle contenu `no_faq_content` et avec les opportunités.
 */
export async function checkSchemaOrgFaq({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const detected = faqPages(pages)
  if (detected.length === 0) return null
  const missingSchema = detected.filter((p) => !getSchemaTypes(p).includes('FAQPage'))
  if (missingSchema.length === 0) return null
  return {
    ruleKey: 'schema_org_faq',
    category: 'schema_org',
    title: 'Schema FAQPage manquant',
    description: `${missingSchema.length} page(s) contiennent des questions/réponses mais ne déclarent pas de schema.org FAQPage. Ce balisage indique noir sur blanc à ChatGPT et Perplexity que vos réponses sont prêtes à être citées — c'est l'un des leviers GEO les plus rentables.`,
    sampleUrls: missingSchema.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 2,
    impact: 3,
  }
}
