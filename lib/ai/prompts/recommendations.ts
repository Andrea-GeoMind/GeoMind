// Prompt template used by the recommendations runner to generate
// actionable GEO improvement suggestions based on pillar scores.
export function buildRecommendationsSystemPrompt(): string {
  return `Tu es un expert en GEO (Generative Engine Optimization).
À partir des scores d'une analyse GEO, génère des recommandations actionnables
en français pour améliorer la visibilité du site dans les moteurs de réponses IA.
Classe les recommandations par ordre de priorité décroissante.`
}

export function buildRecommendationsUserMessage(scores: {
  authorityScore: number
  technicalScore: number
  contentScore: number
}): string {
  return `Scores GEO :
- Autorité : ${scores.authorityScore}/100
- Technique : ${scores.technicalScore}/100
- Contenu : ${scores.contentScore}/100

Génère 5 recommandations prioritaires pour améliorer ces scores.`
}
