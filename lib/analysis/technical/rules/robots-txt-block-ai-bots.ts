import type { TechnicalIssue, RuleInput } from '../types'
import { blockedAiBots } from './_robots-parser'

export async function checkRobotsTxtBlockAiBots({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  const robotsUrl = `${new URL(siteUrl).origin}/robots.txt`
  try {
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const text = await res.text()
    const blocked = blockedAiBots(text)
    if (blocked.length === 0) return null
    return {
      ruleKey: 'robots_txt_block_ai_bots',
      category: 'accessibility',
      title: 'Robots.txt bloque des bots IA',
      description: `Les agents IA suivants sont bloqués dans votre robots.txt : ${blocked.join(', ')}. Ces bots ne pourront pas indexer votre site dans leurs moteurs de réponse.`,
      sampleUrls: [robotsUrl],
      severity: 'major',
      effort: 1,
      impact: 3,
    }
  } catch {
    return null
  }
}
