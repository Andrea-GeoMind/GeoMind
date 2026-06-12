import type { TechnicalPageRuleFn } from '../types'

// markdown × 4 ≈ taille HTML correspondante. On signale au-delà de ~2 MB estimés.
const MARKDOWN_HEAVY_THRESHOLD = 500_000

/** Scope page (V2) : signale une page anormalement lourde. */
export const checkPageSizeHeavy: TechnicalPageRuleFn = async (page) => {
  if ((page.markdown?.length ?? 0) <= MARKDOWN_HEAVY_THRESHOLD) return null
  return {
    ruleKey: 'page_size_heavy',
    category: 'performance',
    title: 'Page trop lourde',
    description: `Cette page est particulièrement volumineuse (plus de 2 MB estimés). Les crawlers IA tronquent ou abandonnent les pages trop lourdes : une partie de votre contenu n'est jamais lue, donc jamais citée.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 1,
  }
}
