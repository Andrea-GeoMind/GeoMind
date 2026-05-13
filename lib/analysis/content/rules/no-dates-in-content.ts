import type { RuleInput, ContentIssue } from '../types'

// Matches dates like: 2024, 2024-01-15, 15/01/2024, janvier 2024, jan. 2024
const DATE_PATTERN =
  /\b(20\d{2})\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-](20\d{2})\b|(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan\.|fév\.|mar\.|avr\.|juil\.|août|sep\.|oct\.|nov\.|déc\.)\s+20\d{2}/i

function hasDateContent(markdown: string | null | undefined): boolean {
  if (!markdown) return false
  return DATE_PATTERN.test(markdown)
}

export async function checkNoDatesInContent({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const hasAnyDates = contentPages.some((p) => hasDateContent(p.markdown))
  if (hasAnyDates) return null

  return {
    ruleKey: 'no_dates_in_content',
    category: 'coverage',
    title: 'Absence de dates dans le contenu',
    description: `Aucune date n'a été détectée dans vos contenus. Les moteurs IA privilégient les informations datées car elles signalent la fraîcheur et la fiabilité du contenu.`,
    sampleUrls: contentPages.slice(0, 3).map((p) => p.url),
    penalty: 5,
  }
}
