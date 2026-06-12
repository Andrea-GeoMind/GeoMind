import type { TechnicalPageRuleFn } from '../types'
import { getMetaString } from './_metadata-helpers'

/**
 * Scope page : la page a des métadonnées mais aucune URL canonique exploitable
 * (ni balise canonical, ni og:url).
 */
export const checkCanonicalMissing: TechnicalPageRuleFn = async (page) => {
  if (!page.metadata) return null
  const canonical = getMetaString(page, 'canonical', 'ogUrl', 'og:url')
  if (canonical) return null
  return {
    ruleKey: 'canonical_missing',
    category: 'accessibility',
    title: 'URL canonique manquante',
    description:
      "Cette page ne déclare pas d'URL canonique (balise canonical ou og:url). Sans elle, les crawlers IA peuvent indexer des doublons de la même page (avec/sans paramètres) et diluer le signal : aucune version ne ressort clairement dans leurs réponses.",
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
