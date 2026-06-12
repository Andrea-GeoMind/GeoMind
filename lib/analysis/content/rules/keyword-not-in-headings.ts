import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Normalise pour comparaison : minuscules, accents supprimés. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function getHeadings(page: FirecrawlPage): string[] {
  const headings: string[] = []

  const { metadata } = page
  if (metadata) {
    const h1s = Array.isArray(metadata.h1) ? metadata.h1 : metadata.h1 ? [metadata.h1] : []
    headings.push(...h1s, ...(metadata.h2 ?? []))
  }

  if (page.markdown) {
    const mdHeadings = page.markdown.match(/^#{1,2}\s+(.+)$/gm) ?? []
    headings.push(...mdHeadings.map((h) => h.replace(/^#{1,2}\s+/, '').trim()))
  }

  return headings.filter((h) => h.trim().length > 0)
}

/**
 * Règle PAGE — aucun mot-clé cible dans les titres.
 * Les IA s'appuient fortement sur les H1/H2 pour relier une page à une
 * question : si vos mots-clés n'y figurent pas, la page ne sera pas retenue
 * comme source pertinente.
 */
export async function checkKeywordNotInHeadings(
  page: FirecrawlPage,
  input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null

  const keywords = (input.keywords ?? []).filter((k) => k.trim().length > 0)
  if (keywords.length === 0) return null

  const headings = getHeadings(page)
  if (headings.length === 0) return null

  const normalizedHeadings = headings.map(normalize)
  const hasKeyword = keywords.some((keyword) => {
    const normalized = normalize(keyword)
    return normalizedHeadings.some((h) => h.includes(normalized))
  })
  if (hasKeyword) return null

  return {
    ruleKey: 'keyword_not_in_headings',
    category: 'coverage',
    title: 'Mots-clés absents des titres',
    description: `Aucun de vos mots-clés cibles ne figure dans le titre principal ni les sous-titres de cette page. Les IA s'appuient sur les titres pour relier une page à une question : intégrez vos mots-clés naturellement dans le H1 et les H2.`,
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 2,
    impact: 2,
  }
}
