import type { TechnicalPageRuleFn } from '../types'

/**
 * Scope page : l'URL n'est pas lisible — identifiant numérique long dans le
 * chemin, ou au moins 2 paramètres de query.
 */
export const checkUrlNotReadable: TechnicalPageRuleFn = async (page) => {
  let hasNumericId = false
  let queryParamCount = 0
  try {
    const parsed = new URL(page.url)
    hasNumericId = /\d{4,}/.test(parsed.pathname)
    queryParamCount = [...parsed.searchParams.keys()].length
  } catch {
    return null
  }
  if (!hasNumericId && queryParamCount < 2) return null
  return {
    ruleKey: 'url_not_readable',
    category: 'structure',
    title: 'URL peu lisible',
    description:
      "L'adresse de cette page contient un identifiant numérique ou plusieurs paramètres techniques. Une URL descriptive (ex. /services/plomberie-paris) est un indice de plus pour les IA sur le sujet de la page — et elle inspire davantage confiance quand elles la citent en source.",
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 3,
    impact: 1,
  }
}
