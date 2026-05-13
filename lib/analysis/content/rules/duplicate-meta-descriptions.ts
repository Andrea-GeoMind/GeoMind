import type { RuleInput, ContentIssue } from '../types'

export async function checkDuplicateMetaDescriptions({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length < 2) return null

  const descMap = new Map<string, string[]>()

  for (const page of pages) {
    const desc = page.metadata?.description?.trim()
    if (!desc) continue
    const existing = descMap.get(desc) ?? []
    existing.push(page.url)
    descMap.set(desc, existing)
  }

  const duplicateUrls = [...descMap.values()]
    .filter((urls) => urls.length > 1)
    .flat()
    .slice(0, 5)

  if (duplicateUrls.length === 0) return null

  return {
    ruleKey: 'duplicate_meta_descriptions',
    category: 'metadata',
    title: 'Meta descriptions dupliquées',
    description: `Plusieurs pages partagent la même meta description. Les moteurs IA peinent à distinguer les pages sans descriptions uniques, ce qui réduit votre autorité thématique.`,
    sampleUrls: duplicateUrls,
    penalty: 5,
  }
}
