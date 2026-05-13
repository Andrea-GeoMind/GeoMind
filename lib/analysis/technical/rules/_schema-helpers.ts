import type { FirecrawlPage } from '../types'

export function getSchemaTypes(page: FirecrawlPage): string[] {
  const schemas = page.metadata?.schemaOrgs
  if (!Array.isArray(schemas)) return []
  return schemas
    .map((s) => s['@type'])
    .filter((t): t is string => typeof t === 'string')
}
