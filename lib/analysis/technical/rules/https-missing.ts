import type { TechnicalIssue, RuleInput } from '../types'

export async function checkHttpsMissing({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  if (!siteUrl.startsWith('http://')) return null
  return {
    ruleKey: 'https_missing',
    category: 'accessibility',
    title: 'Site non sécurisé (HTTP)',
    description:
      'Votre site utilise HTTP au lieu de HTTPS. Les moteurs IA accordent moins de confiance aux sites non sécurisés et peuvent les déprioriser dans leurs réponses.',
    sampleUrls: [siteUrl],
    severity: 'major',
    effort: 3,
    impact: 3,
  }
}
