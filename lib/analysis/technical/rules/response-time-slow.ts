import type { TechnicalIssue, RuleInput } from '../types'

// Seuil V2 durci : au-delà de 2 s de réponse moyenne, les crawlers IA
// abandonnent ou tronquent fréquemment la lecture de la page.
const SLOW_THRESHOLD_MS = 2000

export async function checkResponseTimeSlow({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  const pagesWithTime = pages.filter((p) => typeof p.metadata?.loadTime === 'number')
  if (pagesWithTime.length === 0) return null

  const avgTime =
    pagesWithTime.reduce((sum, p) => {
      const loadTime = p.metadata?.loadTime
      return typeof loadTime === 'number' ? sum + loadTime : sum
    }, 0) / pagesWithTime.length

  if (avgTime <= SLOW_THRESHOLD_MS) return null

  const slowPages = pagesWithTime.filter((p) => {
    const loadTime = p.metadata?.loadTime
    return typeof loadTime === 'number' && loadTime > SLOW_THRESHOLD_MS
  })

  return {
    ruleKey: 'response_time_slow',
    category: 'performance',
    title: 'Temps de réponse trop lent',
    description: `Votre site répond en moyenne en ${(avgTime / 1000).toFixed(1)}s. Les crawlers IA travaillent avec des délais courts : au-delà de 2s, ils échouent ou abandonnent la lecture, et votre contenu sort de leurs réponses.`,
    sampleUrls: slowPages.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 3,
    impact: 2,
  }
}
