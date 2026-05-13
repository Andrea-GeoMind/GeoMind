import type { RuleInput, ContentIssue } from '../types'

const MIN_TITLE_LENGTH = 20
const THRESHOLD_RATIO = 0.2

export async function checkTitleMissingOrShort({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter((p) => p.statusCode === 200 || p.statusCode == null)
  if (contentPages.length === 0) return null

  const problemPages = contentPages.filter(
    (p) => !p.metadata?.title || p.metadata.title.trim().length < MIN_TITLE_LENGTH
  )
  const ratio = problemPages.length / contentPages.length
  if (ratio <= THRESHOLD_RATIO) return null

  return {
    ruleKey: 'title_missing_or_short',
    category: 'metadata',
    title: 'Titre manquant ou trop court',
    description: `${Math.round(ratio * 100)}% de vos pages ont un titre absent ou inférieur à ${MIN_TITLE_LENGTH} caractères. Un titre descriptif est le premier signal de pertinence pour les moteurs IA.`,
    sampleUrls: problemPages.slice(0, 5).map((p) => p.url),
    penalty: 8,
  }
}
