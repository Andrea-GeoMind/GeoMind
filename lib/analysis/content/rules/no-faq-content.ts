import type { RuleInput, ContentIssue, FirecrawlPage } from '../types'

/** Nombre minimal de titres interrogatifs (cumulés sur le site) pour considérer
 *  qu'un contenu FAQ — explicite ou implicite — existe. */
const MIN_QUESTION_HEADINGS = 3

function countQuestionHeadings(page: FirecrawlPage): number {
  let count = 0

  // Titres markdown terminés par « ? » : FAQ explicite ou Q&A implicite
  if (page.markdown) {
    count += (page.markdown.match(/^#{1,4}\s.*\?\s*$/gm) ?? []).length
  }

  // Titres H1/H2 remontés par les métadonnées du crawl
  const { metadata } = page
  if (metadata) {
    const h1s = Array.isArray(metadata.h1) ? metadata.h1 : metadata.h1 ? [metadata.h1] : []
    const h2s = metadata.h2 ?? []
    count += [...h1s, ...h2s].filter((h) => h.trim().endsWith('?')).length
  }

  return count
}

/**
 * Règle SITE — aucun contenu FAQ (explicite ou implicite).
 * Les titres interrogatifs (terminés par « ? ») comptent comme du contenu FAQ :
 * ils matchent directement les questions que les utilisateurs posent aux IA.
 */
export async function checkNoFaqContent({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const totalQuestions = pages.reduce((sum, p) => sum + countQuestionHeadings(p), 0)
  if (totalQuestions >= MIN_QUESTION_HEADINGS) return null

  return {
    ruleKey: 'no_faq_content',
    category: 'structure',
    title: 'Aucun contenu FAQ détecté',
    description: `Votre site ne contient ni page FAQ ni titres formulés en questions. Or ChatGPT et Perplexity répondent à des questions : un contenu structuré en questions-réponses est le format le plus facile à reprendre tel quel dans leurs réponses.`,
    sampleUrls: [],
    severity: 'moderate',
    effort: 2,
    impact: 3,
  }
}
