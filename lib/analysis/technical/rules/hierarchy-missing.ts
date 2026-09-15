import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'
import { isSectionIndexUrl } from '@/lib/analysis/url-helpers'

/** Plan des niveaux de titres lu dans le HTML, quand le crawl l'a fourni. */
function headingLevels(page: FirecrawlPage): number[] | null {
  const levels = page.metadata?.headingLevels
  return Array.isArray(levels) && levels.every((l) => typeof l === 'number') ? levels : null
}

function isContentPage(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return pathname !== '/' && pathname !== ''
  } catch {
    return false
  }
}

function hasH2(page: FirecrawlPage): boolean {
  if (page.metadata?.h2 && page.metadata.h2.length > 0) return true
  return /^## .+/m.test(page.markdown ?? '')
}

/** Détecte un saut de niveau : un H3 qui apparaît avant tout H2. */
function isLevelSkip(levels: number[]): boolean {
  let h2Seen = false
  for (const level of levels) {
    if (level === 2) h2Seen = true
    else if (level === 3 && !h2Seen) return true
  }
  return false
}

function hasLevelSkip(page: FirecrawlPage): boolean {
  const fromHtml = headingLevels(page)
  if (fromHtml) return isLevelSkip(fromHtml)
  const markdown = page.markdown ?? ''
  return isLevelSkip([...markdown.matchAll(/^(#{2,6}) .+/gm)].map((m) => m[1].length))
}

/**
 * Scope page (V2) : une page de contenu doit avoir une hiérarchie de titres
 * propre — au moins un H2, et pas de H3 sans H2 parent.
 */
export const checkHierarchyMissing: TechnicalPageRuleFn = async (page) => {
  if (!isContentPage(page.url)) return null
  // Un index de section liste des vignettes : sa hiérarchie n'est pas celle d'un contenu.
  if (isSectionIndexUrl(page.url)) return null
  const markdown = page.markdown ?? ''
  const missingH2 = !hasH2(page) && markdown.trim().length > 0
  const levelSkip = hasLevelSkip(page)
  if (!missingH2 && !levelSkip) return null
  const detail = missingH2
    ? "Cette page de contenu n'a aucun sous-titre (H2)."
    : 'Cette page utilise un H3 sans H2 parent (saut de niveau).'
  return {
    ruleKey: 'hierarchy_missing',
    category: 'structure',
    title: 'Hiérarchie de titres défaillante',
    description: `${detail} Les crawlers IA parsent la structure HTML pour découper votre contenu en sections : une hiérarchie incohérente les empêche d'extraire et de citer proprement vos passages.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
