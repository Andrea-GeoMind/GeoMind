// Prompts LLM pour la génération de fiches recommandation par issue GEO.
// Règle CLAUDE.md §5 : tous les prompts sont ici, versionnés.

export function buildRecommendationSystemPrompt(): string {
  return `Tu es un expert en GEO (Generative Engine Optimization) et en référencement.
Tu génères des fiches recommandation courtes, actionnables et compréhensibles par un non-technicien.
Ton ton est direct, positif et pédagogique. Tu réponds en français.
Format de sortie : JSON avec une seule clé "content" contenant le Markdown.`
}

export function buildRecommendationUserMessage(issue: {
  title: string
  description: string
  ruleKey: string
}): string {
  return `Point faible détecté : ${issue.title}
Règle : ${issue.ruleKey}
Détail : ${issue.description}

Génère une fiche recommandation en Markdown avec ces 3 sections :
## Comment corriger
(2-4 étapes concrètes)

## Impact attendu
(1-2 phrases sur ce que ça améliore pour la visibilité IA)

## Effort estimé
(une ligne : Rapide / Quelques heures / Effort important)

Retourne UNIQUEMENT le JSON : {"content": "...markdown..."}`
}
