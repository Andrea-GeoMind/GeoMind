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

// ─── Version complète (plan Business — Sonnet) ────────────────────────────────

export function buildCompleteRecommendationSystemPrompt(): string {
  return `Tu es un consultant GEO (Generative Engine Optimization) senior.
Tu rédiges des guides d'implémentation détaillés, techniques, avec des exemples concrets de code ou de contenu.
Ton audience : développeurs et responsables marketing de PME qui veulent améliorer leur visibilité dans les IAs.
Ton ton est expert, précis et actionnable. Tu réponds en français.
Format de sortie : JSON avec une seule clé "content" contenant le Markdown.`
}

export function buildCompleteRecommendationUserMessage(issue: {
  title: string
  description: string
  ruleKey: string
}): string {
  return `Point faible détecté : ${issue.title}
Règle : ${issue.ruleKey}
Détail : ${issue.description}

Génère un guide d'implémentation complet en Markdown avec ces sections :

## Pourquoi c'est critique pour les IAs
(2-3 phrases expliquant comment les moteurs IA traitent ce signal)

## Comment corriger — étapes détaillées
(4-8 étapes avec exemples de code, balises HTML, ou extraits de contenu concrets selon la règle)

## Exemple concret
(Un bloc de code ou un extrait de contenu avant/après la correction)

## Impact attendu
(Impact quantifiable sur la visibilité IA et le positionnement dans les réponses)

## Outils recommandés
(2-4 outils ou ressources pour implémenter ou vérifier la correction)

## Effort estimé
(une ligne : Rapide / Quelques heures / Effort important)

Retourne UNIQUEMENT le JSON : {"content": "...markdown..."}`
}
