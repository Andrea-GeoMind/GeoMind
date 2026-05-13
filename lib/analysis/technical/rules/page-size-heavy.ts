import type { TechnicalIssue, RuleInput } from '../types'

// markdown × 4 is a rough estimate of the corresponding HTML size.
// Flag pages where estimated HTML > 2 MB.
const MARKDOWN_HEAVY_THRESHOLD = 500_000

export async function checkPageSizeHeavy({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.length === 0) return null
  const heavyPages = pages.filter((p) => (p.markdown?.length ?? 0) > MARKDOWN_HEAVY_THRESHOLD)
  if (heavyPages.length === 0) return null
  return {
    ruleKey: 'page_size_heavy',
    category: 'performance',
    title: 'Pages trop lourdes',
    description: `${heavyPages.length} page(s) sont particulièrement lourdes (>2 MB estimés). Des pages volumineuses ralentissent l'exploration et le traitement par les IAs.`,
    sampleUrls: heavyPages.slice(0, 5).map((p) => p.url),
    penalty: 3,
  }
}
