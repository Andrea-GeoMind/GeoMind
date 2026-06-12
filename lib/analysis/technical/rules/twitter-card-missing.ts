import type { TechnicalPageRuleFn } from '../types'
import { getMetaString } from './_metadata-helpers'

/** Scope page (opportunité) : pas de balise twitter:card. */
export const checkTwitterCardMissing: TechnicalPageRuleFn = async (page) => {
  if (!page.metadata) return null
  if (getMetaString(page, 'twitter:card', 'twitterCard')) return null
  return {
    ruleKey: 'twitter_card_missing',
    category: 'structure',
    title: 'Balise twitter:card absente',
    description:
      "Cette page n'a pas de balise twitter:card. C'est un signal secondaire, mais chaque métadonnée structurée supplémentaire aide les IA (et les aperçus de partage) à présenter proprement votre page — un quick win facile à ajouter.",
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 1,
    impact: 1,
  }
}
