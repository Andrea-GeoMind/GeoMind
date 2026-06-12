import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'

function countH1s(page: FirecrawlPage): number {
  if (page.metadata?.h1 !== undefined) {
    const h1 = page.metadata.h1
    return Array.isArray(h1) ? h1.length : 1
  }
  const matches = page.markdown?.match(/^# .+/gm)
  return matches?.length ?? 0
}

/** Scope page (V2) : chaque page doit avoir exactement un H1. */
export const checkH1MissingOrDuplicate: TechnicalPageRuleFn = async (page) => {
  const count = countH1s(page)
  if (count === 1) return null
  const problem = count === 0 ? 'aucun titre principal (H1)' : `${count} titres principaux (H1)`
  return {
    ruleKey: 'h1_missing_or_duplicate',
    category: 'structure',
    title: count === 0 ? 'H1 manquant' : 'H1 dupliqué',
    description: `Cette page contient ${problem}. Les crawlers IA parsent la structure HTML et s'appuient sur le H1 unique pour comprendre le sujet de la page : sans lui, votre contenu est mal classé et rarement cité par ChatGPT ou Perplexity.`,
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
