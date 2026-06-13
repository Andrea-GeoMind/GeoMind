// Prompts de l'analyse de réputation (PLAN item 31).
// Étape 1 : on demande au moteur ce qu'il SAIT de l'entreprise (réponse libre).
// Étape 2 : on extrait de cette réponse, via Haiku, le sentiment et les
// affirmations factuelles (adresse, horaires, téléphone, prix, services…).
// Centralisé ici (règle CLAUDE.md §5).

/** Question posée à chaque moteur IA sur l'entreprise. */
export function buildReputationQuery(siteName: string, siteUrl: string): string {
  return `Que sais-tu sur l'entreprise « ${siteName} » (${siteUrl}) ? Présente-la en quelques phrases, puis donne les informations pratiques que tu connais : activité, adresse ou ville, horaires, téléphone, fourchette de prix, services principaux. Si tu ne connais pas cette entreprise, dis-le clairement.`
}

export const REPUTATION_EXTRACT_SYSTEM_PROMPT = `Tu analyses la réponse d'un assistant IA au sujet d'une entreprise. Tu dois en extraire, de façon factuelle et sans rien inventer :

1. knows_business : true si l'IA semble connaître l'entreprise, false si elle dit ne pas la connaître ou reste totalement vague.
2. sentiment : 'positive', 'neutral' ou 'negative' — la tonalité générale envers l'entreprise.
3. claims : la liste des AFFIRMATIONS FACTUELLES vérifiables présentes dans la réponse. Pour chacune : un "type" parmi
   ["activite","adresse","ville","horaires","telephone","prix","service","fondation","autre"]
   et la "value" exacte telle qu'affirmée par l'IA.

N'extrais QUE ce qui est réellement affirmé dans le texte. N'ajoute aucune information de ta part. Si l'IA ne connaît pas l'entreprise, claims = [] et knows_business = false.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant/après, format :
{
  "knows_business": true,
  "sentiment": "neutral",
  "claims": [
    { "type": "ville", "value": "Lyon" },
    { "type": "horaires", "value": "fermé le lundi" }
  ]
}`

export function buildReputationExtractMessage(siteName: string, answer: string): string {
  return `Entreprise analysée : « ${siteName} »

Réponse de l'IA à analyser :
<reponse_ia>
${answer.slice(0, 6_000)}
</reponse_ia>

Extrais le JSON demandé.`
}
