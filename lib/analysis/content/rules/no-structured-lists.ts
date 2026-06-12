import type { RuleInput, ContentIssue } from '../types'

const THRESHOLD_RATIO = 0.5
// Matches markdown unordered (- item) or ordered (1. item) lists
const LIST_PATTERN = /^[\-\*][ \t].+|^\d+\.[ \t].+/m

/**
 * Règle SITE — peu de listes structurées.
 * Les listes à puces ou numérotées sont le format le plus simple à extraire
 * pour les IA : elles alimentent directement les réponses en étapes ou critères.
 */
export async function checkNoStructuredLists({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const noListPages = contentPages.filter((p) => !LIST_PATTERN.test(p.markdown ?? ''))
  const ratio = noListPages.length / contentPages.length
  if (ratio <= THRESHOLD_RATIO) return null

  return {
    ruleKey: 'no_structured_lists',
    category: 'readability',
    title: 'Peu de listes structurées',
    description: `${Math.round(ratio * 100)}% de vos pages ne contiennent pas de listes à puces ou numérotées. Ce format facilite l'extraction de données par les IA pour leurs réponses — chaque liste est une opportunité de citation.`,
    sampleUrls: noListPages.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
