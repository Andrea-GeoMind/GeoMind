import type { TechnicalPageRuleFn } from '../types'
import { getMetaString, urlDepth } from './_metadata-helpers'

/**
 * Pages fonctionnelles qu'on met en noindex volontairement, et à juste titre :
 * les signaler reviendrait à demander au client de défaire une bonne pratique.
 */
const FUNCTIONAL_PATH_PATTERN =
  /^\/(login|signin|sign-in|signup|sign-up|register|connexion|inscription|se-connecter|mot-de-passe|reset-password|deconnexion|logout|panier|cart|checkout|commande|compte|account|mon-compte|dashboard|tableau-de-bord|admin|merci|thank-you|recherche|search)(\/|$)/i

function isFunctionalPage(url: string): boolean {
  try {
    return FUNCTIONAL_PATH_PATTERN.test(new URL(url).pathname)
  } catch {
    return false
  }
}

/**
 * Scope page : une page stratégique (accueil ou niveau 1) porte une directive
 * noindex — les IA ne l'indexeront jamais.
 */
export const checkNoindexOnKeyPages: TechnicalPageRuleFn = async (page) => {
  const robots = getMetaString(page, 'robots')
  if (!robots || !robots.toLowerCase().includes('noindex')) return null
  if (urlDepth(page.url) > 1) return null
  if (isFunctionalPage(page.url)) return null
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
