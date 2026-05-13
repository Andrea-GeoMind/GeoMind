import type { RuleInput, ContentIssue } from '../types'

const MIN_DESC_LENGTH = 50
const THRESHOLD_RATIO = 0.3

export async function checkMetaDescriptionTooShort({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const pagesWithDesc = pages.filter(
    (p) =>
      (p.statusCode === 200 || p.statusCode == null) &&
      p.metadata?.description &&
      p.metadata.description.trim().length > 0
  )
  if (pagesWithDesc.length === 0) return null

  const shortPages = pagesWithDesc.filter(
    (p) => (p.metadata?.description?.trim().length ?? 0) < MIN_DESC_LENGTH
  )
  const ratio = shortPages.length / pagesWithDesc.length
  if (ratio <= THRESHOLD_RATIO) return null

  return {
    ruleKey: 'meta_description_too_short',
    category: 'metadata',
    title: 'Meta description trop courte',
    description: `${Math.round(ratio * 100)}% de vos meta descriptions font moins de ${MIN_DESC_LENGTH} caractères. Une description concise mais complète améliore les chances d'être cité par les IAs.`,
    sampleUrls: shortPages.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
