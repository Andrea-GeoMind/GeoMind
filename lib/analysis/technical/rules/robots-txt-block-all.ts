import type { TechnicalIssue, RuleInput } from '../types'
import { blocksAllBots } from './_robots-parser'

export async function checkRobotsTxtBlockAll({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  const robotsUrl = `${new URL(siteUrl).origin}/robots.txt`
  try {
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const text = await res.text()
    if (!blocksAllBots(text)) return null
    return {
      ruleKey: 'robots_txt_block_all',
      category: 'accessibility',
      title: 'Robots.txt bloque tous les crawlers',
      description:
        'Votre fichier robots.txt contient "Disallow: /" pour tous les agents (User-agent: *). Cela empêche les IAs d\'explorer votre site et d\'indexer votre contenu.',
      sampleUrls: [robotsUrl],
      severity: 'major',
      effort: 1,
      impact: 3,
    }
  } catch {
    return null
  }
}
