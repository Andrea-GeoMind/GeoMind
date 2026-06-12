import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

const HOW_TO_PATTERN = /^\s*(comment\b|how\s+to\b)/i

function getH1(page: FirecrawlPage): string | null {
  const h1 = page.metadata?.h1
  if (typeof h1 === 'string' && h1.trim() !== '') return h1
  if (Array.isArray(h1) && typeof h1[0] === 'string' && h1[0].trim() !== '') return h1[0]
  const match = page.markdown?.match(/^# (.+)/m)
  return match ? match[1] : null
}

/**
 * Scope page (opportunité) : la page est un guide « Comment… » mais ne déclare
 * pas de schema HowTo.
 */
export const checkNoHowToSchema: TechnicalPageRuleFn = async (page) => {
  const h1 = getH1(page)
  const title = typeof page.metadata?.title === 'string' ? page.metadata.title : null
  const isHowToPage = (h1 !== null && HOW_TO_PATTERN.test(h1)) || (title !== null && HOW_TO_PATTERN.test(title))
  if (!isHowToPage) return null
  if (getSchemaTypes(page).includes('HowTo')) return null
  return {
    ruleKey: 'no_how_to_schema',
    category: 'schema_org',
    title: 'Schema HowTo manquant sur un guide',
    description:
      'Cette page répond à une question « Comment… » mais ne déclare pas de schema HowTo. Ce balisage découpe votre guide en étapes lisibles par les IA — exactement le format que ChatGPT et Perplexity adorent reprendre dans leurs réponses pas-à-pas.',
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 2,
    impact: 2,
  }
}
