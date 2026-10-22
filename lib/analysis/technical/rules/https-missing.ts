import type { TechnicalIssue, RuleInput } from '../types'

/**
 * L'adresse saisie (ou celle d'une fiche Google) commence souvent par http://
 * alors que le site redirige vers https://. Seules les pages réellement lues
 * font foi : une seule servie en https suffit à écarter le problème (faux
 * positif constaté le 22/10/2026 sur trois sites qui redirigeaient tous).
 */
export async function checkHttpsMissing({ siteUrl, pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (!siteUrl.startsWith('http://')) return null
  if (pages.some((p) => p.url.startsWith('https://'))) return null
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
