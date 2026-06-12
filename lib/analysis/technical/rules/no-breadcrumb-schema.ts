import type { TechnicalPageRuleFn } from '../types'
import { getSchemaTypes } from './_schema-helpers'
import { urlDepth } from './_metadata-helpers'

/** Scope page : page profonde (niveau ≥ 2) sans schema BreadcrumbList. */
export const checkNoBreadcrumbSchema: TechnicalPageRuleFn = async (page) => {
  if (urlDepth(page.url) < 2) return null
  if (getSchemaTypes(page).includes('BreadcrumbList')) return null
  return {
    ruleKey: 'no_breadcrumb_schema',
    category: 'schema_org',
    title: 'Schema BreadcrumbList manquant',
    description:
      "Cette page profonde ne déclare pas de fil d'Ariane structuré (BreadcrumbList). Ce schema explique aux IA où la page se situe dans votre site (Accueil > Services > Plomberie) et les aide à comprendre le contexte de votre contenu avant de le citer.",
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 1,
  }
}
