import type { RuleInput, ContentIssue } from '../types'

const MIN_PAGES = 5

export async function checkLowPageCount({
  pages,
  siteUrl,
}: RuleInput): Promise<ContentIssue | null> {
  const contentPages = pages.filter((p) => p.statusCode === 200 || p.statusCode == null)
  if (contentPages.length >= MIN_PAGES) return null

  return {
    ruleKey: 'low_page_count',
    category: 'coverage',
    title: 'Couverture thématique insuffisante',
    description: `Seulement ${contentPages.length} page(s) ont été indexées sur votre site. Les moteurs IA citent davantage les sites avec une couverture thématique large. Visez au moins ${MIN_PAGES} pages de contenu.`,
    sampleUrls: [siteUrl],
    penalty: 10,
  }
}
