import type { TechnicalPageRuleFn } from '../types'
import { getMetaString } from './_metadata-helpers'

/** Scope page : pas de balise meta viewport (page non adaptée au mobile). */
export const checkMobileViewportMissing: TechnicalPageRuleFn = async (page) => {
  if (!page.metadata) return null
  if (getMetaString(page, 'viewport')) return null
  return {
    ruleKey: 'mobile_viewport_missing',
    category: 'accessibility',
    title: 'Balise viewport mobile absente',
    description:
      "Cette page n'a pas de balise meta viewport : elle n'est probablement pas optimisée pour mobile. Les moteurs IA reprennent les signaux de qualité des moteurs de recherche, où la compatibilité mobile est un critère de base — un site non mobile inspire moins confiance et est moins cité.",
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
