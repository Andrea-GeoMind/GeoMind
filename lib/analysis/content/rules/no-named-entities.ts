import type { RuleInput, ContentIssue } from '../types'

/** Densité minimale de noms propres (mots capitalisés hors début de phrase). */
const MIN_ENTITY_DENSITY = 0.01
/** Volume minimal de texte pour que l'heuristique soit significative. */
const MIN_TOTAL_WORDS = 200

interface EntityStats {
  words: number
  entities: number
}

/**
 * Heuristique simple et déterministe : compte les mots capitalisés qui ne sont
 * pas en début de phrase ni en début de ligne (titres, listes).
 */
function countEntities(markdown: string): EntityStats {
  let words = 0
  let entities = 0

  for (const rawLine of markdown.split('\n')) {
    // Ignore les lignes de titres et le balisage de liste
    const line = rawLine.replace(/^#{1,6}\s+/, '').replace(/^[-*]\s+|^\d+\.\s+/, '')
    const tokens = line.split(/\s+/).filter(Boolean)

    let sentenceStart = true
    for (const token of tokens) {
      const word = token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
      if (word.length === 0) {
        if (/[.!?]$/.test(token)) sentenceStart = true
        continue
      }
      words += 1
      if (!sentenceStart && /^[A-ZÀ-Ý]/.test(word)) entities += 1
      sentenceStart = /[.!?]["»)]*$/.test(token)
    }
  }

  return { words, entities }
}

/**
 * Règle SITE — faible densité de noms propres.
 * Les IA s'appuient sur les entités nommées (marques, lieux, personnes,
 * organismes) pour relier un contenu à un sujet : un texte sans entités est
 * difficile à associer à des questions précises.
 */
export async function checkNoNamedEntities({ pages }: RuleInput): Promise<ContentIssue | null> {
  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  let totalWords = 0
  let totalEntities = 0
  for (const page of contentPages) {
    const { words, entities } = countEntities(page.markdown ?? '')
    totalWords += words
    totalEntities += entities
  }

  if (totalWords < MIN_TOTAL_WORDS) return null
  if (totalEntities / totalWords >= MIN_ENTITY_DENSITY) return null

  return {
    ruleKey: 'no_named_entities',
    category: 'coverage',
    title: 'Peu d\'entités nommées dans le contenu',
    description: `Vos contenus mentionnent très peu de noms propres (marques, lieux, personnes, organismes). Les IA relient les contenus aux questions via ces entités : citer des références concrètes aide ChatGPT et Perplexity à associer votre site à votre domaine d'expertise.`,
    sampleUrls: contentPages.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
