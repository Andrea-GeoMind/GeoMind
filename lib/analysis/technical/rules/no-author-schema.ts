import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'
import { getSchemaTypes, getSchemaEntities, propertyHasType } from './_schema-helpers'
import { isArticleUrl, isSectionIndexUrl } from '@/lib/analysis/url-helpers'

const ARTICLE_SCHEMA_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle'])

function isArticlePage(page: FirecrawlPage): boolean {
  // Un index de section (/blog/) n'est pas un article : il n'a pas à signer d'auteur.
  if (isSectionIndexUrl(page.url)) return false
  if (getSchemaTypes(page).some((t) => ARTICLE_SCHEMA_TYPES.has(t))) return true
  return isArticleUrl(page.url)
}

/**
 * L'auteur peut être imbriqué (`author: { "@type": "Person" }`) ou référencé par
 * `@id` vers une entité Person déclarée ailleurs dans le graphe de la page —
 * c'est ce que génèrent WordPress/Yoast, et donc une grande part du web.
 */
function hasPersonAuthor(page: FirecrawlPage): boolean {
  return getSchemaEntities(page).some((entity) =>
    propertyHasType(entity, 'author', 'Person', page)
  )
}

/** Scope page : page article sans auteur déclaré (schema author de type Person). */
export const checkNoAuthorSchema: TechnicalPageRuleFn = async (page) => {
  if (!isArticlePage(page)) return null
  if (hasPersonAuthor(page)) return null
  return {
    ruleKey: 'no_author_schema',
    category: 'schema_org',
    title: 'Auteur non déclaré sur un article',
    description:
      "Cet article ne déclare pas d'auteur structuré (champ author de type Person dans le schema). Les IA privilégient les contenus signés par une personne identifiable — c'est un signal d'expertise et de fiabilité qui augmente vos chances d'être cité.",
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 2,
    impact: 2,
  }
}
