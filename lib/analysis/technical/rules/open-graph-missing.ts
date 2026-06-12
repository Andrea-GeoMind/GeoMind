import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'
import { getMetaString } from './_metadata-helpers'

const OG_FIELDS: Array<{ label: string; keys: string[] }> = [
  { label: 'og:title', keys: ['ogTitle', 'og:title'] },
  { label: 'og:description', keys: ['ogDescription', 'og:description'] },
  { label: 'og:image', keys: ['ogImage', 'og:image'] },
]

function missingOgFields(page: FirecrawlPage): string[] {
  return OG_FIELDS.filter((f) => !getMetaString(page, ...f.keys)).map((f) => f.label)
}

/** Scope page : au moins 2 balises Open Graph essentielles manquent. */
export const checkOpenGraphMissing: TechnicalPageRuleFn = async (page) => {
  if (!page.metadata) return null
  const missing = missingOgFields(page)
  if (missing.length < 2) return null
  return {
    ruleKey: 'open_graph_missing',
    category: 'structure',
    title: 'Balises Open Graph incomplètes',
    description: `Cette page n'a pas de balises ${missing.join(', ')}. Les Open Graph sont une fiche d'identité lisible en un clin d'œil par les IA : titre, résumé et image de la page. Sans elles, votre contenu est moins bien compris et présenté dans leurs réponses.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 1,
    impact: 2,
  }
}
