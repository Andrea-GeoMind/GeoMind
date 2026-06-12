import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

const MIN_DESC_LENGTH = 80

/**
 * Règle PAGE — meta description trop courte.
 * Une description de moins de 80 caractères ne donne pas assez de matière aux
 * snippets que les IA citent : c'est une occasion manquée, pas une faute.
 */
export async function checkMetaDescriptionTooShort(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null

  const description = page.metadata?.description?.trim() ?? ''
  // L'absence totale est couverte par meta_description_missing
  if (description.length === 0) return null
  if (description.length >= MIN_DESC_LENGTH) return null

  return {
    ruleKey: 'meta_description_too_short',
    category: 'metadata',
    title: 'Meta description trop courte',
    description: `La meta description de cette page fait moins de ${MIN_DESC_LENGTH} caractères. Une description plus complète nourrit les snippets que ChatGPT et Perplexity reprennent en citation et augmente vos chances d'être repris correctement.`,
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 1,
    impact: 1,
  }
}
