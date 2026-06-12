import type { RuleInput, ContentIssue } from '../types'

/**
 * Règle SITE — meta descriptions dupliquées.
 * La meta description nourrit les snippets que les IA citent : si plusieurs
 * pages partagent le même résumé, les IA ne savent plus laquelle référencer.
 */
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
    description: `Plusieurs pages partagent la même meta description. Ce résumé nourrit les snippets que ChatGPT et Perplexity reprennent en citation : des descriptions uniques aident les IA à distinguer vos pages et à citer la bonne.`,
    sampleUrls: duplicateUrls,
    severity: 'minor',
    effort: 1,
    impact: 1,
  }
}
