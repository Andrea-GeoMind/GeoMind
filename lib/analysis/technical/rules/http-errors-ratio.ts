import type { TechnicalIssue, RuleInput } from '../types'

export async function checkHttpErrorsRatio({ pages }: RuleInput): Promise<TechnicalIssue | null> {
  if (pages.length === 0) return null
  const errorPages = pages.filter((p) => (p.statusCode ?? 200) >= 400)
  const ratio = errorPages.length / pages.length
  if (ratio <= 0.05) return null
  return {
    ruleKey: 'http_errors_ratio',
    category: 'accessibility',
    title: "Taux d'erreurs HTTP élevé",
    description: `${Math.round(ratio * 100)}% de vos pages renvoient une erreur (4xx/5xx). Quand un crawler IA tombe sur autant d'erreurs, il considère le site peu fiable et arrête son exploration : ces pages n'apparaîtront jamais dans ChatGPT ou Perplexity.`,
    sampleUrls: errorPages.slice(0, 5).map((p) => p.url),
    severity: 'major',
    effort: 2,
    impact: 3,
  }
}
