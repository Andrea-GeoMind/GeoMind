import type { RuleInput, ContentIssue } from '../types'

const MIN_WORDS = 300
const THRESHOLD_RATIO = 0.3

function countWords(markdown: string | null | undefined): number {
  if (!markdown) return 0
  return markdown.trim().split(/\s+/).filter(Boolean).length
}

export async function checkThinContent({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter((p) => p.statusCode === 200 || p.statusCode == null)
  if (contentPages.length === 0) return null

  const thinPages = contentPages.filter((p) => countWords(p.markdown) < MIN_WORDS)
  const ratio = thinPages.length / contentPages.length
  if (ratio <= THRESHOLD_RATIO) return null

  return {
    ruleKey: 'thin_content',
    category: 'readability',
    title: 'Contenu trop court',
    description: `${Math.round(ratio * 100)}% de vos pages contiennent moins de ${MIN_WORDS} mots. Les moteurs IA privilégient les pages avec un contenu substantiel pour justifier leurs citations.`,
    sampleUrls: thinPages.slice(0, 5).map((p) => p.url),
    penalty: 10,
  }
}
