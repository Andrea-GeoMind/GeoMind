import type { TechnicalIssue, RuleInput } from '../types'

/**
 * Scope site : des pages découvertes pendant le crawl renvoient une erreur 4xx.
 * Ce sont typiquement des liens internes cassés (pages supprimées ou déplacées).
 */
export async function checkBrokenInternalLinks({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const brokenPages = pages.filter(
    (p) => typeof p.statusCode === 'number' && p.statusCode >= 400 && p.statusCode <= 499
  )
  if (brokenPages.length === 0) return null
  return {
    ruleKey: 'broken_internal_links',
    category: 'structure',
    title: 'Liens internes cassés',
    description: `${brokenPages.length} page(s) de votre site renvoient une erreur 4xx : ce sont probablement des liens internes qui pointent vers des pages supprimées. Chaque lien cassé est une impasse pour les crawlers IA — ils gaspillent leur budget d'exploration et passent à côté de vos vraies pages.`,
    sampleUrls: brokenPages.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
