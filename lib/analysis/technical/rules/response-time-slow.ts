import type { TechnicalIssue, RuleInput } from '../types'

export async function checkResponseTimeSlow({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const pagesWithTime = pages.filter((p) => typeof p.metadata?.loadTime === 'number')
  if (pagesWithTime.length === 0) return null

  const avgTime =
    pagesWithTime.reduce((sum, p) => {
      const loadTime = p.metadata?.loadTime
      return typeof loadTime === 'number' ? sum + loadTime : sum
    }, 0) / pagesWithTime.length

  if (avgTime <= 3000) return null

  const slowPages = pagesWithTime.filter((p) => {
    const loadTime = p.metadata?.loadTime
    return typeof loadTime === 'number' && loadTime > 3000
  })

  return {
    ruleKey: 'response_time_slow',
    category: 'performance',
    title: 'Temps de réponse trop lent',
    description: `Le temps de réponse moyen de votre site est de ${(avgTime / 1000).toFixed(1)}s. Au-delà de 3s, les IAs peuvent déprioriser votre contenu dans leurs réponses.`,
    sampleUrls: slowPages.slice(0, 5).map((p) => p.url),
    penalty: 5,
  }
}
