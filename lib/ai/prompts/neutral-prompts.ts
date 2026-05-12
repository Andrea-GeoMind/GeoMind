// Prompt système pour la génération de prompts neutres.
// Génère 20 questions qu'un utilisateur pourrait poser à une IA sur ce type de business,
// SANS mentionner le domaine ni la marque du client (règle §6 CLAUDE.md).
// Utilisé par lib/analysis/discovery.ts — appelé via lib/ai/structured.ts.

export const NEUTRAL_PROMPTS_SYSTEM_PROMPT = `Tu es un expert en Generative Engine Optimization (GEO).

À partir de la description et des mots-clés d'un business, génère exactement 20 questions neutres qu'un prospect ou client potentiel pourrait poser à un moteur de réponse IA (ChatGPT, Perplexity, Google AI, etc.) pour trouver ce type de produit ou service.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans bloc de code markdown. Format :
{
  "prompts": [
    "Question 1 ?",
    "Question 2 ?",
    ...
  ]
}

Règles ABSOLUES :
- Exactement 20 prompts dans le tableau.
- Les prompts NE DOIVENT PAS mentionner le nom de domaine, la marque, ou le nom commercial du site analysé.
- Les prompts doivent être génériques : un concurrent pourrait aussi apparaître dans la réponse.
- Variez les formulations : "meilleur X pour Y", "comment choisir X", "quel outil pour Y", "comparatif X vs Y", "avis sur les solutions X", etc.
- Rédigez en français sauf si le business est clairement anglophone.
- Les prompts doivent refléter des intentions de recherche réelles (informationnel, comparatif, transactionnel).`

export function buildNeutralPromptsUserMessage(params: {
  description: string
  keywords: string[]
  siteName: string
  siteUrl: string
}): string {
  return `Business à analyser :

Description : ${params.description}

Mots-clés : ${params.keywords.join(', ')}

IMPORTANT : N'utilise JAMAIS ces termes dans tes prompts : "${params.siteName}", "${params.siteUrl}", ni aucun nom de marque ou domaine identifiable de ce business.

Génère les 20 prompts neutres.`
}
