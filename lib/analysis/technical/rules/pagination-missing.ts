import type { TechnicalIssue, RuleInput } from '../types'

const PAGINATION_PATTERN = /\/page\/\d+|[?&]page=/i
const LISTING_MIN_PAGES = 5

function firstSegment(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    return segments[0] ?? null
  } catch {
    return null
  }
}

/**
 * Scope site (opportunité) : le site a une section de type listing (blog,
 * catalogue…) mais aucune URL de pagination n'a été découverte au crawl.
 * Soit la pagination n'existe pas, soit elle n'est pas crawlable.
 */
export async function checkPaginationMissing({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.some((p) => PAGINATION_PATTERN.test(p.url))) return null

  const groups = new Map<string, string[]>()
  for (const page of pages) {
    const segment = firstSegment(page.url)
    if (!segment) continue
    const urls = groups.get(segment) ?? []
    urls.push(page.url)
    groups.set(segment, urls)
  }

  let listingUrls: string[] | null = null
  for (const urls of groups.values()) {
    if (urls.length >= LISTING_MIN_PAGES && (!listingUrls || urls.length > listingUrls.length)) {
      listingUrls = urls
    }
  }
  if (!listingUrls) return null

  return {
    ruleKey: 'pagination_missing',
    category: 'structure',
    title: 'Pagination introuvable au crawl',
    description:
      "Votre site a une section avec de nombreuses pages (blog, catalogue…) mais aucune URL de pagination n'a été découverte. Vérifiez que votre pagination est crawlable (liens HTML classiques, pas seulement un bouton « charger plus ») : sinon les IA ne découvriront que vos contenus les plus récents.",
    sampleUrls: listingUrls.slice(0, 5),
    severity: 'opportunity',
    effort: 2,
    impact: 1,
  }
}
