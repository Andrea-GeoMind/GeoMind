import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Longueur minimale d'un H2 (en caractères). */
const MIN_H2_LENGTH = 30
/** Part maximale de H2 trop courts avant de flagger. */
const MAX_SHORT_RATIO = 0.5
/** Nombre minimal de H2 pour que la règle s'applique. */
const MIN_H2_COUNT = 2

function getH2s(page: FirecrawlPage): string[] {
  const fromMetadata = page.metadata?.h2
  if (fromMetadata && fromMetadata.length > 0) return fromMetadata
  if (!page.markdown) return []
  return (page.markdown.match(/^##\s+(.+)$/gm) ?? []).map((h) => h.replace(/^##\s+/, '').trim())
}

/**
 * Règle PAGE — sous-titres (H2) trop courts.
 * Des titres vagues ("Services", "Infos") ne matchent pas les questions posées
 * aux IA : un H2 descriptif est une porte d'entrée vers une citation.
 */
export async function checkHeadingsTooShort(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null

  const h2s = getH2s(page)
  if (h2s.length < MIN_H2_COUNT) return null

  const shortH2s = h2s.filter((h) => h.trim().length < MIN_H2_LENGTH)
  const ratio = shortH2s.length / h2s.length
  if (ratio <= MAX_SHORT_RATIO) return null

  return {
    ruleKey: 'headings_too_short',
    category: 'structure',
    title: 'Sous-titres trop courts ou vagues',
    description: `Plus de la moitié des sous-titres (H2) de cette page font moins de ${MIN_H2_LENGTH} caractères. Des titres vagues ne matchent pas les questions posées aux IA : reformulez-les en phrases descriptives, idéalement en questions.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 1,
    impact: 1,
  }
}
