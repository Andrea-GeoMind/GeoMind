// Prompt système pour la génération de prompts neutres citation-inducing.
// Objectif : générer des requêtes qui poussent les LLMs à répondre avec des LISTES d'entreprises
// et leurs URLs — pas des réponses informatives génériques.
// Règle fondamentale GEO : un LLM cite ce qu'il liste. Un prompt qui force une liste de ≥10
// entreprises avec URLs est 10× plus susceptible de produire une citation mesurable.
// PLAN item 10 : 10 prompts (et non 3) — à 3 prompts × 4 moteurs = 12 mesures, l'intervalle
// de confiance du score était de ±25 pts ; à 10 prompts × 4 moteurs = 40 mesures, ±8 pts.
// Utilisé par lib/analysis/discovery.ts — appelé via lib/ai/structured.ts.

/** Nombre de prompts neutres générés à la découverte — fiabilité statistique du score. */
export const NEUTRAL_PROMPTS_COUNT = 10

export const NEUTRAL_PROMPTS_SYSTEM_PROMPT = `Tu es un expert en Generative Engine Optimization (GEO).

À partir de la description et des mots-clés d'un business, génère exactement ${NEUTRAL_PROMPTS_COUNT} requêtes que des prospects pourraient soumettre à un moteur de réponse IA (ChatGPT, Perplexity, Google AI, etc.).

OBJECTIF CRITIQUE : chaque requête doit forcer le LLM interrogé à répondre avec une LISTE d'entreprises, prestataires ou solutions, avec leurs sites web. Ce sont ces listes qui permettent de mesurer si un site est cité ou non.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans bloc de code markdown. Format :
{
  "prompts": [
    "Requête 1",
    "Requête 2",
    "... (${NEUTRAL_PROMPTS_COUNT} au total)"
  ]
}

Règles ABSOLUES :
- Exactement ${NEUTRAL_PROMPTS_COUNT} prompts dans le tableau.
- Les prompts NE DOIVENT PAS mentionner le nom de domaine, la marque, ou le nom commercial du site analysé.
- Chaque prompt doit demander EXPLICITEMENT une liste d'acteurs, prestataires, outils ou entreprises.
- Chaque prompt doit demander EXPLICITEMENT au moins 10 exemples.
- Chaque prompt doit demander les sites web ou URLs dans la réponse.
- Varie les angles : ne reformule pas 10 fois la même question.
- Rédigez en français sauf si le business est clairement anglophone.

Répartis les prompts entre ces 5 styles (2 prompts par style) :

1. LISTE DIRECTE — "Quels sont les meilleurs [X] en France ? Donne-moi une liste de 10 avec leurs sites web."
2. COMPARATIF — "Compare les 10 principales solutions [X] disponibles en France : pour chaque, donne le nom, l'URL et le point fort."
3. RECOMMANDATION EXPERTE — "En tant qu'expert, tu recommandes quels [prestataires/outils] pour [besoin précis] ? Cite au moins 10 acteurs avec leurs sites web."
4. BESOIN CONCRET — "J'ai [problème/besoin client typique], quelles entreprises peuvent m'aider ? Liste 10 options avec leurs sites."
5. CRITÈRE D'ACHAT — "Quels [X] choisir pour [critère : budget serré, qualité, rapidité, débutant…] ? Donne 10 noms avec leurs URLs."

Si le business est local (artisan, commerce, restaurant…), intègre la ville ou la région dans au moins 3 prompts.`

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

Génère les ${NEUTRAL_PROMPTS_COUNT} prompts citation-inducing (2 par style).`
}
