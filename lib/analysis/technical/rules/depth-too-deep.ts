import type { TechnicalIssue, RuleInput } from '../types'
import { urlDepth } from './_metadata-helpers'

export async function checkDepthTooDeep({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.length === 0) return null
  const deepPages = pages.filter((p) => urlDepth(p.url) > 3)
  const ratio = deepPages.length / pages.length
  if (ratio <= 0.3) return null
  return {
    ruleKey: 'depth_too_deep',
    category: 'structure',
    title: 'Architecture du site trop profonde',
    description: `${Math.round(ratio * 100)}% de vos pages sont enfouies à plus de 3 niveaux de clics. Les crawlers de ChatGPT ou Perplexity ont un budget d'exploration limité : les pages trop profondes sont souvent ignorées et ne seront jamais citées.`,
    sampleUrls: deepPages.slice(0, 5).map((p) => p.url),
    severity: 'minor',
    effort: 3,
    impact: 1,
  }
}
