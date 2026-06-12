import type { RuleInput, ContentIssue } from '../types'

const CONTACT_URL_PATTERN = /contact/i
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i

/**
 * Règle SITE — coordonnées introuvables.
 * Une page contact ou un email visible est un signal de légitimité : les IA
 * favorisent les sites identifiables, derrière lesquels il y a une vraie
 * organisation joignable.
 */
export async function checkContactInfoMissing({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const hasContactPage = pages.some((p) => CONTACT_URL_PATTERN.test(p.url))
  if (hasContactPage) return null

  const hasVisibleEmail = pages.some((p) => p.markdown && EMAIL_PATTERN.test(p.markdown))
  if (hasVisibleEmail) return null

  return {
    ruleKey: 'contact_info_missing',
    category: 'coverage',
    title: 'Coordonnées de contact introuvables',
    description: `Aucune page contact ni adresse email visible n'a été détectée sur votre site. Les IA favorisent les sites clairement identifiables : des coordonnées accessibles renforcent la confiance et donc vos chances d'être cité comme source légitime.`,
    sampleUrls: [],
    severity: 'minor',
    effort: 1,
    impact: 2,
  }
}
