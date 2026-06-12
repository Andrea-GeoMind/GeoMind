import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Seuil de longueur (en mots) à partir duquel un sommaire est attendu. */
const MIN_WORDS_FOR_TOC = 1500

// Liens d'ancres internes : [Section](#section)
const ANCHOR_LINK_PATTERN = /\]\(#/

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Règle PAGE — page très longue sans sommaire.
 * Un sommaire avec liens d'ancres aide les IA (et les lecteurs) à repérer la
 * section qui répond à une question précise dans une page longue.
 */
export async function checkNoTableOfContents(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null
  if (!page.markdown) return null

  if (countWords(page.markdown) <= MIN_WORDS_FOR_TOC) return null
  if (ANCHOR_LINK_PATTERN.test(page.markdown)) return null

  return {
    ruleKey: 'no_table_of_contents',
    category: 'structure',
    title: 'Page très longue sans sommaire',
    description: `Cette page dépasse ${MIN_WORDS_FOR_TOC} mots mais n'a pas de sommaire avec liens d'ancres. Un sommaire aide les IA à localiser la section qui répond précisément à une question, et augmente vos chances d'être cité sur des requêtes pointues.`,
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 2,
    impact: 1,
  }
}
