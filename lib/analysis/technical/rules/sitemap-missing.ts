import type { TechnicalIssue, RuleInput } from '../types'

export async function checkSitemapMissing({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  const sitemapUrl = `${new URL(siteUrl).origin}/sitemap.xml`
  try {
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) })
    if (res.ok) return null
    return {
      ruleKey: 'sitemap_missing',
      category: 'accessibility',
      title: 'Sitemap XML manquant',
      description:
        "Votre site n'a pas de sitemap.xml accessible. Un sitemap aide les IAs à découvrir et indexer l'ensemble de vos pages.",
      sampleUrls: [sitemapUrl],
      severity: 'moderate',
      effort: 1,
      impact: 2,
    }
  } catch {
    return null
  }
}
