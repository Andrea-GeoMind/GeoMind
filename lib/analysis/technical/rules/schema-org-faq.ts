import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

/**
 * Détection durcie (V2) : une page est considérée « FAQ » dès qu'elle contient
 * du contenu de type questions/réponses, même sans titre interrogatif :
 * - ≥ 3 titres (H1-H4) se terminant par un point d'interrogation
 * - ≥ 3 questions en gras (pattern courant des FAQ : **Question ?**)
 * - ≥ 3 lignes Q/R explicites (« Q : », « Question : »)
 * - URL contenant /faq
 */
function isFaqPage(page: FirecrawlPage): boolean {
  const markdown = page.markdown ?? ''
  const questionHeadings = markdown.match(/^#{1,4}.+\?/gm) ?? []
  if (questionHeadings.length >= 3) return true
  const boldQuestions = markdown.match(/\*\*[^*\n]+\?\s*\*\*/g) ?? []
  if (boldQuestions.length >= 3) return true
  const qaLines = markdown.match(/^>?\s*(?:Q|Question)\s*[:.]/gim) ?? []
  if (qaLines.length >= 3) return true
  try {
    return /\/faq(?:\/|$|\.)/i.test(new URL(page.url).pathname)
  } catch {
    return false
  }
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
    description: `${missingSchema.length} page(s) contiennent des questions/réponses mais ne déclarent pas de schema.org FAQPage. Ce balisage indique noir sur blanc à ChatGPT et Perplexity que vos réponses sont prêtes à être citées — c'est l'un des leviers GEO les plus rentables.`,
    sampleUrls: missingSchema.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 2,
    impact: 3,
  }
}
