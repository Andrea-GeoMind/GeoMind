/**
 * lib/analysis/authority-actions.ts
 *
 * Actions d'autorité du plan d'action.
 *
 * Le plan ne lisait que deux sources — Technique et Contenu — et restait donc
 * muet sur l'autorité, y compris quand elle était à 0. Ce n'était pas un seuil
 * mal réglé : le pilier était absent du plan.
 *
 * Ces actions sont dérivées, pas détectées : elles ne constatent pas un défaut
 * sur une page précise, elles décrivent le travail hors site qui construit
 * l'autorité. C'est pour ça qu'elles n'ont ni pageUrl ni pénalité de score.
 *
 * Règle de rédaction : aucune promesse d'être cité. On décrit ce que font les
 * moteurs avec ces signaux — ce qui est observable — pas le résultat qu'on
 * obtiendrait, qui ne dépend pas de nous. Fonction pure, sans appel réseau ni
 * LLM.
 */

/** En dessous de ce score, le pilier autorité est considéré comme bas. */
export const LOW_AUTHORITY_THRESHOLD = 40

export interface AuthorityAction {
  ruleKey: string
  title: string
  description: string
  severity: 'major' | 'moderate' | 'minor' | 'opportunity'
  effort: number
  impact: number
}

export interface AuthorityActionsInput {
  /** Note d'autorité de la dernière analyse (0-100), null si non mesurée. */
  authorityScore: number | null
  /**
   * Plateformes du registre off-site où le site est absent, si la détection a
   * tourné. Sert à ne pas conseiller un annuaire déjà renseigné.
   */
  absentPlatformNames?: string[]
}

/**
 * Les quatre leviers d'autorité, dans l'ordre où ils se travaillent.
 *
 * Contenu tiré de ce qu'on observe en interrogeant les moteurs sur des métiers
 * locaux : ils décrivent une entreprise à partir de ses fiches et des sources
 * tierces, pas de son site.
 */
function baseActions(absentPlatformNames: string[]): AuthorityAction[] {
  const annuaireSuffix =
    absentPlatformNames.length > 0
      ? ` D'après notre détection, vous êtes absent de : ${absentPlatformNames.join(', ')}.`
      : ''

  return [
    {
      ruleKey: 'authority_google_business_profile',
      title: 'Complétez votre fiche Google, en commençant par la catégorie',
      description:
        "La catégorie principale de votre fiche Google doit être exactement celle de votre métier. Une catégorie approximative écarte l'entreprise des réponses sur son propre secteur : les moteurs s'appuient sur ce champ pour savoir de quoi vous faites partie. Vérifiez-la, puis complétez le reste — horaires, zone d'intervention, prestations, photos récentes. Mettez ensuite en place une démarche d'avis régulière plutôt qu'une vague ponctuelle : à métier et ville identiques, les entreprises qui reviennent le plus souvent dans les réponses sont celles qui ont le plus d'avis, et des avis récents.",
      severity: 'major',
      effort: 2,
      impact: 3,
    },
    {
      ruleKey: 'authority_directories',
      title: 'Faites-vous décrire par les annuaires de votre secteur',
      description: `Les moteurs décrivent une entreprise à partir de ses fiches d'annuaire autant que de son site. Visez Pages Jaunes, puis l'annuaire de référence de votre métier — Houzz pour l'aménagement, Doctolib pour la santé, mariages.net pour l'événementiel, Batup pour le bâtiment, selon votre activité. Une fiche utile est une fiche décrite : activité détaillée, prestations, zone couverte, pas seulement un nom et un numéro.${annuaireSuffix}`,
      severity: 'major',
      effort: 2,
      impact: 3,
    },
    {
      ruleKey: 'authority_service_pages',
      title: 'Une page par prestation, qui répond aux questions des clients',
      description:
        "Une page par prestation, qui répond à ce qu'un client demande avant d'acheter : combien ça coûte (une fourchette vaut mieux que rien), comment ça se passe, en combien de temps, ce qui est inclus. Une page « Nos services » qui énumère des intitulés ne donne aux moteurs rien à reprendre. Une page qui répond précisément à une question leur donne un passage citable.",
      severity: 'moderate',
      effort: 3,
      impact: 3,
    },
    {
      ruleKey: 'authority_third_party_mentions',
      title: 'Faites parler de vous ailleurs que chez vous',
      description:
        "Tout ce qui précède reste déclaratif : c'est vous qui parlez de vous. Les mentions par des tiers sont ce qui permet aux moteurs de recouper. Visez la presse locale et les blogs de votre ville, les comparatifs et classements de votre métier, les sites de vos partenaires, fournisseurs et associations professionnelles. Un article qui vous nomme sur un site tiers pèse plus qu'une page de plus sur le vôtre.",
      severity: 'moderate',
      effort: 4,
      impact: 3,
    },
  ]
}

/**
 * Actions d'autorité à afficher dans le plan.
 *
 * Renvoie un tableau vide quand l'autorité n'est pas mesurée ou n'est pas
 * basse : on ne charge pas le plan d'un site qui est déjà cité.
 */
export function buildAuthorityActions({
  authorityScore,
  absentPlatformNames = [],
}: AuthorityActionsInput): AuthorityAction[] {
  if (authorityScore === null) return []
  if (authorityScore >= LOW_AUTHORITY_THRESHOLD) return []
  return baseActions(absentPlatformNames)
}
