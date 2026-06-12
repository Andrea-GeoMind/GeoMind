import type { TechnicalPageRuleFn, FirecrawlPage } from '../types'
import { getSchemaTypes } from './_schema-helpers'

const ARTICLE_SCHEMA_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle'])
const ARTICLE_URL_PATTERN = /\/blog|\/article|\/actualite/i

function isArticlePage(page: FirecrawlPage): boolean {
  if (getSchemaTypes(page).some((t) => ARTICLE_SCHEMA_TYPES.has(t))) return true
  try {
    return ARTICLE_URL_PATTERN.test(new URL(page.url).pathname)
  } catch {
    return false
  }
}

function isPerson(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>)['@type'] === 'Person'
  )
}

function hasPersonAuthor(page: FirecrawlPage): boolean {
  const schemas = page.metadata?.schemaOrgs
  if (!Array.isArray(schemas)) return false
  return schemas.some((schema) => {
    const author = schema['author']
    if (isPerson(author)) return true
    return Array.isArray(author) && author.some(isPerson)
  })
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
