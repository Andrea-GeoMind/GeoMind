import type { RuleInput, ContentIssue, FirecrawlPage } from '../types'

// Marqueurs de contenu comparatif dans une URL, un title ou un titre markdown
const COMPARATIVE_PATTERN =
  /\b(comparatifs?|comparaisons?|vs|versus|meilleurs?|meilleures?|top|classements?|alternatives?)\b/i

function hasComparativeSignal(page: FirecrawlPage): boolean {
  if (COMPARATIVE_PATTERN.test(page.url.replace(/[-_/]/g, ' '))) return true
  const title = page.metadata?.title
  if (title && COMPARATIVE_PATTERN.test(title)) return true
  if (page.markdown) {
    const headings = page.markdown.match(/^#{1,4}\s.+$/gm) ?? []
    if (headings.some((h) => COMPARATIVE_PATTERN.test(h))) return true
  }
  return false
}

/**
 * Règle SITE — aucun contenu comparatif.
 * Les questions qui génèrent des citations IA sont majoritairement comparatives
 * ("quel est le meilleur...", "X vs Y") : sans page comparative, votre site est
 * absent des réponses les plus recherchées.
 */
export async function checkNoComparativeContent({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const hasComparative = pages.some((p) => hasComparativeSignal(p))
  if (hasComparative) return null

  return {
    ruleKey: 'no_comparative_content',
    category: 'coverage',
    title: 'Aucun contenu comparatif',
    description: `Votre site ne contient aucune page comparative (comparatif, "vs", meilleur, top, classement, alternative). Or les questions posées aux IA sont majoritairement comparatives : créer un comparatif honnête de votre marché est l'un des meilleurs moyens d'être cité par ChatGPT et Perplexity.`,
    sampleUrls: [],
    severity: 'opportunity',
    effort: 3,
    impact: 3,
  }
}
