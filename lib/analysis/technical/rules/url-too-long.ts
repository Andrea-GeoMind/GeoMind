import type { TechnicalPageRuleFn } from '../types'

const MAX_URL_LENGTH = 100

/** Scope page (opportunité) : URL de plus de 100 caractères. */
export const checkUrlTooLong: TechnicalPageRuleFn = async (page) => {
  if (page.url.length <= MAX_URL_LENGTH) return null
  return {
    ruleKey: 'url_too_long',
    category: 'structure',
    title: 'URL très longue',
    description: `Cette URL fait ${page.url.length} caractères. Les URLs courtes et descriptives sont plus souvent reprises telles quelles dans les réponses des IA ; une adresse interminable est parfois tronquée ou écartée au profit d'une source plus propre.`,
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 3,
    impact: 1,
  }
}
