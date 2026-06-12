import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

const MIN_TITLE_LENGTH = 20

/**
 * Règle PAGE — title absent ou trop court.
 * Le title est le premier élément que les IA lisent pour comprendre une page :
 * il nourrit directement les snippets cités par ChatGPT et Perplexity.
 */
export async function checkTitleMissingOrShort(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null

  const title = page.metadata?.title?.trim() ?? ''
  if (title.length >= MIN_TITLE_LENGTH) return null

  return {
    ruleKey: 'title_missing_or_short',
    category: 'metadata',
    title: title.length === 0 ? 'Titre de page manquant' : 'Titre de page trop court',
    description: `Cette page a un titre ${title.length === 0 ? 'absent' : `de moins de ${MIN_TITLE_LENGTH} caractères`}. Le title nourrit les snippets que les IA citent : un titre descriptif et complet est le premier signal de pertinence pour ChatGPT et Perplexity.`,
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
