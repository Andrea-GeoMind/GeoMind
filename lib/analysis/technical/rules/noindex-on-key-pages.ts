import type { TechnicalPageRuleFn } from '../types'
import { getMetaString, urlDepth } from './_metadata-helpers'

/**
 * Scope page : une page stratégique (accueil ou niveau 1) porte une directive
 * noindex — les IA ne l'indexeront jamais.
 */
export const checkNoindexOnKeyPages: TechnicalPageRuleFn = async (page) => {
  const robots = getMetaString(page, 'robots')
  if (!robots || !robots.toLowerCase().includes('noindex')) return null
  if (urlDepth(page.url) > 1) return null
  return {
    ruleKey: 'noindex_on_key_pages',
    category: 'accessibility',
    title: 'Page clé en noindex',
    description:
      "Cette page stratégique (accueil ou premier niveau) porte une directive noindex : vous demandez explicitement aux moteurs — y compris ceux qui alimentent ChatGPT et Perplexity — de ne jamais l'indexer. Elle ne sera donc jamais citée, retirez cette directive si ce n'est pas voulu.",
    sampleUrls: [page.url],
    severity: 'major',
    effort: 1,
    impact: 3,
  }
}
