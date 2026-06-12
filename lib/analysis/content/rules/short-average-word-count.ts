import type { RuleInput, ContentIssue } from '../types'

const MIN_AVG_WORDS = 300
const MIN_PAGES_WITH_MARKDOWN = 3

function countWords(markdown: string): number {
  return markdown.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Règle SITE — moyenne de mots par page trop faible.
 * Un site dont les pages font en moyenne moins de 300 mots offre peu de matière
 * exploitable : les IA citent les contenus qui développent réellement un sujet.
 */
export async function checkShortAverageWordCount({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length < MIN_PAGES_WITH_MARKDOWN) return null

  const totalWords = contentPages.reduce((sum, p) => sum + countWords(p.markdown ?? ''), 0)
  const avgWords = totalWords / contentPages.length
  if (avgWords >= MIN_AVG_WORDS) return null

  const shortestPages = [...contentPages].sort(
    (a, b) => countWords(a.markdown ?? '') - countWords(b.markdown ?? '')
  )

  return {
    ruleKey: 'short_average_word_count',
    category: 'readability',
    title: 'Pages trop courtes en moyenne',
    description: `Vos pages contiennent en moyenne ${Math.round(avgWords)} mots, en dessous des ${MIN_AVG_WORDS} mots recommandés. ChatGPT et Perplexity citent les contenus qui traitent un sujet en profondeur : développez vos pages principales avec des explications concrètes.`,
    sampleUrls: shortestPages.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 3,
    impact: 3,
  }
}
