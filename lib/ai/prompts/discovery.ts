// Prompt système pour la phase de découverte.
// Analyse le contenu crawlé d'un site et extrait : description, mots-clés, concurrents.
// Utilisé par lib/analysis/discovery.ts — appelé via lib/ai/structured.ts.

export const DISCOVERY_SYSTEM_PROMPT = `Tu es un expert en analyse de sites web et en référencement dans les moteurs de réponses IA.

À partir du contenu markdown d'un site web, tu dois extraire :
1. Une description concise du business (2-3 phrases maximum)
2. Une liste de 10 à 20 mots-clés ou expressions-clés pertinents pour ce business
3. Une liste de 5 à 10 concurrents directs identifiables

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans bloc de code markdown. Format :
{
  "description": "Description concise du business en 2-3 phrases.",
  "keywords": ["mot-clé 1", "expression clé 2", ...],
  "competitors": [
    { "url": "https://concurrent1.com", "name": "Nom Concurrent 1" },
    ...
  ]
}

Règles strictes :
- La description doit expliquer CE QUE fait le business, pour QUI, et sa PROPOSITION DE VALEUR.
- Les mots-clés doivent être ceux qu'un prospect utiliserait pour chercher ce type de service/produit.
- Les concurrents sont des entreprises proposant des offres similaires ou substituables.
- Si tu ne peux pas identifier de concurrents, retourne un tableau vide.
- Les URLs de concurrents doivent être des domaines valides (ex: https://exemple.com).`

export function buildDiscoveryUserMessage(pages: Array<{ url: string; markdown: string | null }>): string {
  const MAX_CHARS = 12_000

  const content = pages
    .filter((p) => p.markdown)
    .map((p) => `### Page : ${p.url}\n\n${p.markdown}`)
    .join('\n\n---\n\n')

  const truncated = content.length > MAX_CHARS ? content.slice(0, MAX_CHARS) + '\n\n[... contenu tronqué]' : content

  return `Voici le contenu crawlé du site :\n\n${truncated}\n\nAnalyse ce contenu et retourne le JSON demandé.`
}
