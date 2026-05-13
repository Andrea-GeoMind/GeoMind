import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'

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

export async function checkHierarchyMissing({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const contentPages = pages.filter((p) => isContentPage(p.url))
  if (contentPages.length === 0) return null
  const pagesWithoutH2 = contentPages.filter((p) => !hasH2(p))
  const ratio = pagesWithoutH2.length / contentPages.length
  if (ratio <= 0.5) return null
  return {
    ruleKey: 'hierarchy_missing',
    category: 'structure',
    title: 'Hiérarchie de titres insuffisante',
    description: `${Math.round(ratio * 100)}% des pages de contenu n'ont pas de sous-titre (H2). Une hiérarchie de titres aide les IAs à structurer leur compréhension du contenu.`,
    sampleUrls: pagesWithoutH2.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
