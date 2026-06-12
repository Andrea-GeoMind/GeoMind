import type { RuleInput, ContentIssue } from '../types'

/** Nombre minimal de liens sortants vers des domaines tiers sur tout le site. */
const MIN_EXTERNAL_LINKS = 2

// Liens markdown [texte](https://...)
const MARKDOWN_LINK_PATTERN = /\]\((https?:\/\/[^)\s]+)\)/g

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function countExternalLinks(markdown: string, siteHostname: string): number {
  let count = 0
  for (const match of markdown.matchAll(MARKDOWN_LINK_PATTERN)) {
    const linkHost = getHostname(match[1])
    if (linkHost && linkHost !== siteHostname) count += 1
  }
  return count
}

/**
 * Règle SITE — moins de 2 liens sortants vers des domaines tiers.
 * Citer ses sources est un signal E-E-A-T fort : les IA font davantage
 * confiance aux contenus qui référencent des sources externes vérifiables.
 */
export async function checkNoExternalCitations({
  pages,
  siteUrl,
}: RuleInput): Promise<ContentIssue | null> {
  const siteHostname = getHostname(siteUrl)
  if (!siteHostname) return null

  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const totalExternal = contentPages.reduce(
    (sum, p) => sum + countExternalLinks(p.markdown ?? '', siteHostname),
    0
  )
  if (totalExternal >= MIN_EXTERNAL_LINKS) return null

  return {
    ruleKey: 'no_external_citations',
    category: 'coverage',
    title: 'Aucune source externe citée',
    description: `Vos contenus ne contiennent quasiment aucun lien vers des sources externes. Citer ses sources (études, médias, références officielles) est un signal de fiabilité E-E-A-T : les IA privilégient les contenus qui s'appuient sur des références vérifiables.`,
    sampleUrls: contentPages.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
