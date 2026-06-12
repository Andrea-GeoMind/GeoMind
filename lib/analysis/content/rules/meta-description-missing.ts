import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/**
 * Règle PAGE — meta description manquante.
 * La meta description sert de résumé de référence aux IA quand elles citent
 * une page : sans elle, ChatGPT et Perplexity doivent deviner le sujet.
 */
export async function checkMetaDescriptionMissing(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null

  const description = page.metadata?.description?.trim() ?? ''
  if (description.length > 0) return null

  return {
    ruleKey: 'meta_description_missing',
    category: 'metadata',
    title: 'Meta description manquante',
    description: `Cette page n'a pas de meta description. Ce résumé nourrit les snippets que les IA reprennent en citation : rédigez 1 à 2 phrases qui résument la page et donnent envie de la citer.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 1,
    impact: 2,
  }
}
