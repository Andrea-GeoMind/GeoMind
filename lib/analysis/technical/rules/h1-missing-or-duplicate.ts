import type { TechnicalIssue, RuleInput, FirecrawlPage } from '../types'

function countH1s(page: FirecrawlPage): number {
  if (page.metadata?.h1 !== undefined) {
    const h1 = page.metadata.h1
    return Array.isArray(h1) ? h1.length : 1
  }
  const matches = page.markdown?.match(/^# .+/gm)
  return matches?.length ?? 0
}

export async function checkH1MissingOrDuplicate({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.length === 0) return null
  const problemPages = pages.filter((p) => countH1s(p) !== 1)
  const ratio = problemPages.length / pages.length
  if (ratio <= 0.2) return null
  return {
    ruleKey: 'h1_missing_or_duplicate',
    category: 'structure',
    title: 'H1 manquant ou dupliqué',
    description: `${Math.round(ratio * 100)}% des pages n'ont pas exactement un H1. Les IAs utilisent le H1 comme signal principal du sujet d'une page.`,
    sampleUrls: problemPages.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
