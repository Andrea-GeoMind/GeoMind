import type { RuleInput, ContentIssue } from '../types'

/** Plancher de la médiane des longueurs de pages (en mots). */
const MEDIAN_FLOOR_WORDS = 150

function countWords(markdown: string | null | undefined): number {
  if (!markdown) return 0
  return markdown.trim().split(/\s+/).filter(Boolean).length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Règle SITE — contenu trop court.
 * Raisonne sur la MÉDIANE des longueurs de pages : si la moitié du site fait
 * moins de 150 mots, les IA n'ont pas assez de matière à citer.
 */
export async function checkThinContent({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter((p) => p.statusCode === 200 || p.statusCode == null)
  if (contentPages.length === 0) return null

  const wordCounts = contentPages.map((p) => countWords(p.markdown))
  const medianWords = median(wordCounts)
  if (medianWords >= MEDIAN_FLOOR_WORDS) return null

  const thinPages = contentPages.filter((p) => countWords(p.markdown) < MEDIAN_FLOOR_WORDS)

  return {
    ruleKey: 'thin_content',
    category: 'readability',
    title: 'Contenu trop court sur la majorité des pages',
    description: `La longueur médiane de vos pages est de ${Math.round(medianWords)} mots, sous le plancher de ${MEDIAN_FLOOR_WORDS} mots. ChatGPT et Perplexity citent en priorité les pages assez riches pour étayer une réponse : étoffez vos pages clés avec du contenu réellement informatif.`,
    sampleUrls: thinPages.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 3,
    impact: 3,
  }
}
