import type { TechnicalIssue, RuleInput } from '../types'
import { getSchemaTypes } from './_schema-helpers'

const ORG_TYPES = new Set(['Organization', 'LocalBusiness', 'Corporation', 'NGO', 'Store'])

export async function checkSchemaOrgOrganization({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const homePage = pages.find((p) => {
    try {
      const { pathname } = new URL(p.url)
      return pathname === '/' || pathname === ''
    } catch {
      return false
    }
  })
  if (!homePage) return null
  const hasOrg = getSchemaTypes(homePage).some((t) => ORG_TYPES.has(t))
  if (hasOrg) return null
  return {
    ruleKey: 'schema_org_organization',
    category: 'schema_org',
    title: 'Schema Organisation manquant',
    description:
      "La page d'accueil ne déclare pas de schema.org Organization (ou LocalBusiness). Ce schema aide les IAs à identifier et mémoriser votre organisation.",
    sampleUrls: [homePage.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
