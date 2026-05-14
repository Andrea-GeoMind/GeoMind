// Prompts pour la génération des publishers par secteur.
// Utilisés par lib/analysis/publishers.ts via callStructured (Haiku).

export const PUBLISHERS_SYSTEM_PROMPT = `Tu es un expert en stratégie de visibilité pour les moteurs de réponses IA (GEO - Generative Engine Optimization).

Ta mission : identifier les 15 meilleurs sites éditoriaux où un client devrait obtenir de la visibilité pour maximiser ses citations dans ChatGPT, Perplexity, Gemini et Claude.

Retourne UNIQUEMENT un JSON valide selon ce schéma :
{
  "publishers": [
    {
      "name": "Nom du site",
      "url": "https://exemple.fr",
      "category": "media" | "community" | "public_base",
      "pitch_angle": "Angle d'approche concret pour obtenir une présence sur ce site"
    }
  ]
}

Règles strictes :
- Exactement 15 publishers : 5 médias FR (category="media"), 5 communautés (category="community"), 5 bases publiques/encyclopédiques (category="public_base")
- Les URLs doivent être réelles et pertinentes pour le secteur
- Chaque pitch_angle doit être actionnable et spécifique au secteur du client (1-2 phrases)
- Favoriser les sources fréquemment citées par les LLMs : Wikipédia, Reddit (fr), forums spécialisés, médias de référence FR
- Ne jamais inclure le site du client lui-même`

export function buildPublishersUserMessage(params: {
  siteName: string
  siteUrl: string
  description: string
  keywords: string[]
  sector: string
}): string {
  return `Site client : ${params.siteName} (${params.siteUrl})

Secteur : ${params.sector}

Description : ${params.description}

Mots-clés principaux : ${params.keywords.slice(0, 10).join(', ')}

Génère la liste de 15 publishers (5 médias FR, 5 communautés, 5 bases publiques) où ce client devrait obtenir de la visibilité pour être cité dans les IAs.`
}
