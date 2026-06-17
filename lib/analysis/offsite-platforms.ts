// Registre curé des plateformes clés du GEO (présence off-site).
//
// L'autorité off-site — être présent sur les sites que les IA recoupent pour
// décider qui citer — est le levier n°1 du GEO. Cette liste, et les démarches
// associées, sont volontairement codées en dur (pas générées par LLM) : ce sont
// des connaissances stables, vérifiées, qui constituent le cœur actionnable de
// l'onglet « Présence off-site ». Les publishers sectoriels (générés par LLM)
// les complètent par secteur.
//
// Aucune dépendance I/O : importable côté client (UI) et en tests.

export type OffSitePlatformCategory =
  | 'identite' // fiche d'entité officielle (LinkedIn, Google Business, Wikidata)
  | 'avis' // plateformes d'avis (Trustpilot, avis Google)
  | 'annuaire' // annuaires SaaS / pro
  | 'communaute' // communautés très citées par les IA (Reddit…)
  | 'encyclopedie' // bases publiques (Wikipédia)

export interface OffSitePlatform {
  /** identifiant stable, stocké en DB */
  id: string
  name: string
  /** domaine racine, sert à matcher l'URL de profil détectée */
  domain: string
  category: OffSitePlatformCategory
  /** 1 = incontournable, 2 = fortement recommandé, 3 = bonus */
  priority: 1 | 2 | 3
  /** pourquoi ça compte pour la visibilité dans les IA */
  why: string
  /** démarche concrète pour s'y inscrire / y être présent */
  steps: string[]
  /** true si l'inscription est gratuite et en self-service */
  selfServeFree: boolean
  /** indice de recherche pour la détection (sinon : name) */
  searchHint?: string
}

export const OFF_SITE_PLATFORMS: OffSitePlatform[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn (page entreprise)',
    domain: 'linkedin.com',
    category: 'identite',
    priority: 1,
    why: 'Signal d’entité B2B n°1 en France. Fortement recoupé par les IA pour confirmer qu’une entreprise existe et ce qu’elle fait.',
    steps: [
      'Étoffez votre profil personnel (photo, poste « Fondateur », ~15 relations) — LinkedIn l’exige avant de créer une Page.',
      'Allez sur linkedin.com/company/setup/new → « Entreprise ».',
      'Renseignez nom, URL publique, slogan, secteur, logo.',
      'Complétez la description (À propos), les spécialités et le lieu.',
    ],
    selfServeFree: true,
  },
  {
    id: 'google_business',
    name: 'Google Business Profile',
    domain: 'google.com',
    category: 'identite',
    priority: 1,
    why: 'Source majeure pour les recommandations locales des IA : catégorie, adresse, horaires et avis y sont puisés.',
    steps: [
      'Créez/réclamez la fiche sur google.com/business.',
      'Choisissez la bonne catégorie d’activité (pas « logiciel » au hasard).',
      'Ajoutez description, site web, lien réseaux sociaux.',
      'Passez la validation (souvent code par téléphone/courrier).',
    ],
    selfServeFree: true,
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    domain: 'wikidata.org',
    category: 'encyclopedie',
    priority: 1,
    why: 'Base de connaissances structurée lisible par TOUTES les IA. Ne demande pas la notoriété de Wikipédia.',
    steps: [
      'Créez un compte sur wikidata.org (CAPTCHA + confirmation email).',
      'Special:NewItem → label + description.',
      'Ajoutez les déclarations : nature de l’élément, pays, site officiel, date de création.',
      'Liez les identifiants externes (X, etc.) pour renforcer l’entité.',
    ],
    selfServeFree: true,
  },
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    domain: 'crunchbase.com',
    category: 'annuaire',
    priority: 2,
    why: 'Fiche entreprise très lue par les IA pour les requêtes B2B/SaaS et la crédibilité.',
    steps: [
      'Créez un compte (Sign up, possible via Google).',
      'Add a company → remplissez nom, descriptions, catégories, site, date.',
      'Ajoutez le siège (localisation) et les liens sociaux.',
      'Soumettez — la fiche passe en modération avant publication.',
    ],
    selfServeFree: true,
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    domain: 'producthunt.com',
    category: 'communaute',
    priority: 2,
    why: 'Forte autorité tech ; le lancement génère backlinks et mentions datées.',
    steps: [
      'Créez un compte (connexion via X/Google possible).',
      'Complétez le profil (accroche, lien, photo).',
      'Préparez la page produit et planifiez un lancement un jour précis (événement one-shot).',
    ],
    selfServeFree: true,
  },
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    domain: 'trustpilot.com',
    category: 'avis',
    priority: 2,
    why: 'Les IA pondèrent fortement les avis. Une page Trustpilot avec des avis récents = signal de confiance.',
    steps: [
      'Réclamez votre profil gratuit sur business.trustpilot.com.',
      'Vérifiez le domaine.',
      'Invitez vos premiers clients à laisser un avis (volume + fraîcheur comptent).',
    ],
    selfServeFree: true,
  },
  {
    id: 'wikipedia',
    name: 'Wikipédia',
    domain: 'wikipedia.org',
    category: 'encyclopedie',
    priority: 3,
    why: 'Source la plus citée par les IA — mais exige une réelle notoriété (sources secondaires indépendantes).',
    steps: [
      'À ne tenter que si l’entreprise a une couverture presse indépendante suffisante (critères d’admissibilité stricts).',
      'En attendant, concentrez-vous sur Wikidata (sans seuil de notoriété).',
    ],
    selfServeFree: true,
  },
  {
    id: 'pages_jaunes',
    name: 'Pages Jaunes',
    domain: 'pagesjaunes.fr',
    category: 'annuaire',
    priority: 3,
    why: 'Annuaire FR de référence, recoupé pour les recherches locales et la cohérence Nom/Adresse/Téléphone.',
    steps: [
      'Créez/réclamez la fiche sur pagesjaunes.fr (espace pro).',
      'Veillez à la cohérence exacte avec votre site et Google Business (nom, adresse, téléphone).',
    ],
    selfServeFree: true,
  },
  {
    id: 'societe_com',
    name: 'Societe.com / annuaires légaux',
    domain: 'societe.com',
    category: 'annuaire',
    priority: 3,
    why: 'Confirme l’existence légale de l’entité (SIREN) — signal de fiabilité pour les IA.',
    steps: [
      'Une fois l’entreprise immatriculée, la fiche est souvent créée automatiquement.',
      'Vérifiez l’exactitude des informations publiques.',
    ],
    selfServeFree: true,
  },
  {
    id: 'alternativeto',
    name: 'AlternativeTo',
    domain: 'alternativeto.net',
    category: 'annuaire',
    priority: 3,
    why: 'Très cité par les IA pour les requêtes « alternative à… / meilleur outil pour… ».',
    steps: [
      'Créez un compte gratuit.',
      'Ajoutez votre logiciel (description, catégories, lien) — self-service.',
    ],
    selfServeFree: true,
  },
  {
    id: 'g2',
    name: 'G2',
    domain: 'g2.com',
    category: 'avis',
    priority: 3,
    why: 'Référence mondiale des avis logiciels, fréquemment citée pour les comparatifs.',
    steps: [
      'Réclamez/créez le profil produit sur g2.com.',
      'Collectez des avis clients vérifiés.',
    ],
    selfServeFree: true,
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    domain: 'x.com',
    category: 'identite',
    priority: 2,
    why: 'Compte de marque officiel — point de recoupement d’entité, contenu indexé par les moteurs de réponse.',
    steps: [
      'Créez le compte (nom de marque, @handle cohérent).',
      'Bio claire + lien vers le site + photo/bannière.',
      'Publiez régulièrement pour exister.',
    ],
    selfServeFree: true,
  },
]

export function getOffSitePlatform(id: string): OffSitePlatform | undefined {
  return OFF_SITE_PLATFORMS.find((p) => p.id === id)
}

export const OFF_SITE_CATEGORY_LABELS: Record<OffSitePlatformCategory, string> = {
  identite: 'Identité & entité',
  avis: 'Avis & réputation',
  annuaire: 'Annuaires',
  communaute: 'Communautés',
  encyclopedie: 'Bases publiques',
}
