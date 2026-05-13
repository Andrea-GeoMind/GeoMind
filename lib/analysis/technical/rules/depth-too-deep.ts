import type { TechnicalIssue, RuleInput } from '../types'

function urlDepth(url: string): number {
  try {
    const { pathname } = new URL(url)
    return pathname.split('/').filter(Boolean).length
  } catch {
    return 0
  }
}

export async function checkDepthTooDeep({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.length === 0) return null
  const deepPages = pages.filter((p) => urlDepth(p.url) > 3)
  const ratio = deepPages.length / pages.length
  if (ratio <= 0.3) return null
  return {
    ruleKey: 'depth_too_deep',
    category: 'structure',
    title: 'Architecture du site trop profonde',
    description: `${Math.round(ratio * 100)}% des pages sont à plus de 3 niveaux de profondeur. Les IAs explorent difficilement les contenus trop imbriqués.`,
    sampleUrls: deepPages.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
