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
    description: `${Math.round(ratio * 100)}% des pages crawlées retournent une erreur HTTP (4xx/5xx). Les IAs évitent de citer des sites avec de nombreuses pages en erreur.`,
    sampleUrls: errorPages.slice(0, 5).map((p) => p.url),
    penalty: 15,
  }
}
