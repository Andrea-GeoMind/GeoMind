import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

// Pages éditoriales : articles de blog, actualités, guides
const ARTICLE_URL_PATTERN = /\/(blog|articles?|actualites?|actualités?|guides?)(\/|$)/i

// Signaux d'auteur : « par {Majuscule} » (sensible à la casse pour éviter
// « par exemple »), « auteur(e) », « rédigé(e) par »
const AUTHOR_BY_NAME_PATTERN = /\bpar\s+[A-ZÀ-Ý]/
const AUTHOR_KEYWORD_PATTERN = /\bauteure?s?\b|\brédigée?s? par\b/i

/**
 * Règle PAGE — article sans auteur identifié.
 * Signer ses articles est un signal E-E-A-T : les IA accordent plus de crédit
 * aux contenus attribués à une personne identifiable qu'aux textes anonymes.
 */
export async function checkNoAuthorBio(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null
  if (!ARTICLE_URL_PATTERN.test(page.url)) return null
  if (!page.markdown) return null

  if (AUTHOR_BY_NAME_PATTERN.test(page.markdown)) return null
  if (AUTHOR_KEYWORD_PATTERN.test(page.markdown)) return null

  return {
    ruleKey: 'no_author_bio',
    category: 'readability',
    title: 'Article sans auteur identifié',
    description: `Cet article ne mentionne pas son auteur. Les IA accordent plus de crédit aux contenus signés par une personne identifiable (signal E-E-A-T) : ajoutez "Rédigé par [Prénom Nom]" avec une courte bio en fin d'article.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 1,
  }
}
