import type { TechnicalIssue, RuleInput } from '../types'

function isValidSitemap(text: string): boolean {
  const trimmed = text.trim()
  return (
    (trimmed.startsWith('<?xml') || trimmed.startsWith('<urlset') || trimmed.startsWith('<sitemapindex')) &&
    (trimmed.includes('<urlset') || trimmed.includes('<sitemapindex'))
  )
}

export async function checkSitemapMalformed({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  const sitemapUrl = `${new URL(siteUrl).origin}/sitemap.xml`
  try {
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const text = await res.text()
    if (isValidSitemap(text)) return null
    return {
      ruleKey: 'sitemap_malformed',
      category: 'accessibility',
      title: 'Sitemap XML malformé',
      description:
        "Votre sitemap.xml existe mais n'est pas un XML valide. Un sitemap malformé empêche les IAs de l'utiliser pour explorer votre site.",
      sampleUrls: [sitemapUrl],
      penalty: 5,
    }
  } catch {
    return null
  }
}
