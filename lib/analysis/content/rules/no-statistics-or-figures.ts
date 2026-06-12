import type { RuleInput, ContentIssue } from '../types'

/** Nombre minimal de signaux chiffrés (cumulés sur le site) pour considérer
 *  que le contenu s'appuie sur des données. */
const MIN_STAT_SIGNALS = 3

// Pourcentages (42 %, 3,5%), « selon », « étude(s) », nombres suivis d'une unité.
// NB : pas de \b autour des termes accentués ou de « € » — \b ne fonctionne
// qu'avec les caractères ASCII \w en JavaScript.
const STAT_PATTERNS: RegExp[] = [
  /\d+(?:[.,]\d+)?\s?%/g,
  /\bselon\b/gi,
  /étude/gi,
  /\b\d+(?:[.,]\d+)?\s?(?:€|euros?|km|kg|m²|cm|mm|ans|heures?|minutes?|jours?|clients?|millions?|milliards?)(?!\p{L})/giu,
]

function countStatSignals(markdown: string): number {
  return STAT_PATTERNS.reduce((sum, pattern) => {
    pattern.lastIndex = 0
    return sum + (markdown.match(pattern) ?? []).length
  }, 0)
}

/**
 * Règle SITE — quasi-absence de données chiffrées.
 * Les IA citent en priorité les contenus chiffrés (pourcentages, études,
 * mesures) : un chiffre précis est une "preuve" facile à reprendre en réponse.
 */
export async function checkNoStatisticsOrFigures({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const totalSignals = contentPages.reduce(
    (sum, p) => sum + countStatSignals(p.markdown ?? ''),
    0
  )
  if (totalSignals >= MIN_STAT_SIGNALS) return null

  return {
    ruleKey: 'no_statistics_or_figures',
    category: 'coverage',
    title: 'Quasi-absence de données chiffrées',
    description: `Vos contenus ne contiennent presque aucun chiffre (pourcentage, étude, mesure). Les IA comme ChatGPT et Perplexity citent en priorité les contenus chiffrés, perçus comme plus fiables : ajoutez des statistiques sourcées et des données concrètes.`,
    sampleUrls: contentPages.slice(0, 5).map((p) => p.url),
    severity: 'moderate',
    effort: 2,
    impact: 2,
  }
}
