import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Moyenne maximale de mots par phrase. */
const MAX_AVG_WORDS_PER_SENTENCE = 30
/** Nombre minimal de phrases pour que la moyenne soit significative. */
const MIN_SENTENCES = 10

interface SentenceStats {
  sentences: number
  totalWords: number
}

function computeSentenceStats(markdown: string): SentenceStats {
  // On retire titres, listes et tableaux : seules les phrases comptent
  const prose = markdown
    .split('\n')
    .filter((line) => !/^#{1,6}\s|^[-*]\s|^\d+\.\s|^\||^>/.test(line.trim()))
    .join(' ')

  const sentences = prose
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2)

  const totalWords = sentences.reduce(
    (sum, s) => sum + s.split(/\s+/).filter(Boolean).length,
    0
  )
  return { sentences: sentences.length, totalWords }
}

/**
 * Règle PAGE — phrases trop longues.
 * Les IA découpent le texte en unités de sens : des phrases de plus de 30 mots
 * en moyenne sont difficiles à extraire et à citer fidèlement.
 */
export async function checkPoorSentenceLength(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null
  if (!page.markdown) return null

  const { sentences, totalWords } = computeSentenceStats(page.markdown)
  if (sentences < MIN_SENTENCES) return null

  const avgWords = totalWords / sentences
  if (avgWords <= MAX_AVG_WORDS_PER_SENTENCE) return null

  return {
    ruleKey: 'poor_sentence_length',
    category: 'readability',
    title: 'Phrases trop longues',
    description: `Les phrases de cette page font en moyenne ${Math.round(avgWords)} mots, au-delà des ${MAX_AVG_WORDS_PER_SENTENCE} mots recommandés. Les IA extraient plus facilement des phrases courtes et autonomes : découpez vos idées, une phrase = une idée.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 1,
  }
}
