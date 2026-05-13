import type { RuleInput, ContentIssue } from '../types'

const THRESHOLD_RATIO = 0.2

export async function checkMetaDescriptionMissing({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter((p) => p.statusCode === 200 || p.statusCode == null)
  if (contentPages.length === 0) return null

  const missingPages = contentPages.filter(
    (p) => !p.metadata?.description || p.metadata.description.trim().length === 0
  )
  const ratio = missingPages.length / contentPages.length
  if (ratio <= THRESHOLD_RATIO) return null

  return {
    ruleKey: 'meta_description_missing',
    category: 'metadata',
    title: 'Meta description manquante',
    description: `${Math.round(ratio * 100)}% de vos pages n'ont pas de meta description. Les moteurs IA utilisent cette description comme résumé de référence lors des citations.`,
    sampleUrls: missingPages.slice(0, 5).map((p) => p.url),
    penalty: 8,
  }
}
