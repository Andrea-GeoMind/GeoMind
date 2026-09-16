/**
 * lib/marketing/secteurs.ts
 *
 * Registre des pages secteur (/secteurs/<slug>). Source unique pour la route
 * dynamique, les métadonnées, l'image OG, le sitemap et les liens internes.
 *
 * Tout le contenu variable d'un secteur vit ici : la page elle-même
 * (app/(marketing)/secteurs/[secteur]/page.tsx) ne contient que la mise en
 * forme. Ouvrir un nouveau secteur (avocats, agences immobilières…) = ajouter
 * un objet à SECTEURS, sans toucher au JSX.
 *
 * Ton imposé : factuel, posé, aucun terme technique sans glose immédiate.
 * Les termes métier du produit (« GEO », « LLM », balisage…) sont proscrits
 * dans ces textes — l'audience ne les connaît pas et ne veut pas les apprendre.
 */

export interface SecteurProbleme {
  /** Titre en langage courant — jamais le nom technique de la règle. */
  titre: string
  corps: string
}

export interface SecteurFaq {
  q: string
  a: string
}

export interface SecteurConfig {
  /** Segment d'URL : /secteurs/<slug>. */
  slug: string
  /** Badge du hero + libellé dans les listes de liens. */
  label: string
  /** Le métier au singulier, tel qu'un client le dirait (« dentiste »). */
  metier: string
  /** Comment le secteur nomme sa clientèle — « patient », « client »… */
  termeClient: string
  /** Pluriel de `termeClient`, quand il n'est pas régulier. */
  termeClientPluriel: string

  // ─── Métadonnées ───────────────────────────────────────────────────────────
  metaTitle: string
  metaDescription: string
  /** Titre court et concret pour l'aperçu de lien partagé (OG/Twitter). */
  ogTitle: string
  keywords: string[]
  /** Décrit l'audience dans le balisage Schema.org de la page. */
  audienceType: string

  // ─── 1 · Accroche ──────────────────────────────────────────────────────────
  h1: string
  /** Mis en évidence à la fin du H1. */
  h1Accent: string
  accroche: string
  /** Questions patient citées dans le hero — formulées comme elles seraient tapées. */
  exempleQuestions: string[]

  // ─── 2 · Le constat ────────────────────────────────────────────────────────
  constatTitre: string
  constatIntro: string
  constatParagraphes: string[]

  // ─── 3 · Ce que ça coûte ───────────────────────────────────────────────────
  coutTitre: string
  coutIntro: string
  /** L'acte à forte valeur qui justifie l'enjeu, et ce qu'il représente. */
  acteLourd: { actesCourants: string; actesLourds: string; enjeu: string }
  /** L'intermédiaire qui capte le client quand le site ne le fait pas. */
  plateformeCaptive: string
  /** Les variables que le lecteur seul peut chiffrer. */
  variablesDuCalcul: string

  // ─── 5 · Les problèmes fréquents ───────────────────────────────────────────
  problemesTitre: string
  problemesIntro: string
  problemes: SecteurProbleme[]
  /**
   * Mention de provenance des constats. Renseignée uniquement quand le secteur
   * a réellement été analysé — sinon on n'affiche aucune revendication.
   */
  problemesSource?: string

  // ─── 6 · CTA ───────────────────────────────────────────────────────────────
  ctaTitre: string
  ctaCorps: string

  // ─── FAQ ───────────────────────────────────────────────────────────────────
  faq: SecteurFaq[]

  /**
   * Encadré réglementaire — propre aux professions encadrées (santé, droit).
   * Absent pour les secteurs sans contrainte de communication.
   */
  cadreReglementaire?: { titre: string; corps: string }
}

const CABINETS_DENTAIRES: SecteurConfig = {
  slug: 'cabinets-dentaires',
  label: 'Cabinets dentaires & médicaux',
  metier: 'dentiste',
  termeClient: 'patient',
  termeClientPluriel: 'patients',

  metaTitle: 'Votre cabinet dentaire est-il cité par ChatGPT ?',
  metaDescription:
    'Vos patients demandent à ChatGPT quel dentiste consulter. GEOMIND pose 10 questions de patients aux principales IA et vérifie si votre cabinet est cité — audit gratuit, sans inscription.',
  ogTitle: 'Quand un patient demande à une IA quel dentiste consulter, êtes-vous cité ?',
  keywords: [
    'visibilité cabinet dentaire',
    'ChatGPT dentiste',
    'cabinet dentaire intelligence artificielle',
    'patients recherche IA',
    'communication cabinet dentaire',
  ],
  audienceType:
    'Chirurgiens-dentistes, orthodontistes, cabinets dentaires de groupe, centres de santé dentaire',

  h1: 'Quand un patient demande à une IA quel dentiste consulter,',
  h1Accent: 'votre cabinet est-il cité ?',
  accroche:
    'Vos patients posent désormais ces questions à ChatGPT, et reçoivent une réponse qui nomme deux ou trois cabinets. GEOMIND vérifie si le vôtre en fait partie — et, s’il n’y est pas, ce qui l’en empêche.',
  exempleQuestions: [
    'Quel dentiste consulter à Lyon ?',
    'Un orthodontiste pour adulte dans le 3e',
    'Dentiste qui prend les urgences le samedi',
  ],

  constatTitre: 'Ce n’est plus le même jeu que Google.',
  constatIntro:
    'De plus en plus de patients commencent leur recherche dans une IA plutôt que dans un moteur de recherche. La différence n’est pas cosmétique.',
  constatParagraphes: [
    'Google affiche une liste de dix cabinets et vous laisse choisir. Une IA rédige une réponse et en nomme deux ou trois. Il n’y a pas de deuxième page.',
    'Conséquence directe, et c’est ce qui surprend le plus les praticiens : être bien placé sur Google ne garantit pas d’être cité par ChatGPT. Les deux ne lisent pas les mêmes choses et n’appliquent pas les mêmes critères. Un cabinet premier sur « dentiste » et le nom de sa ville peut être totalement absent des réponses IA sur la même question.',
    'Une IA ne classe pas des liens : elle recoupe plusieurs sources — votre site, votre fiche de prise de rendez-vous, les annuaires, les avis — et ne retient que les cabinets dont les informations sont cohérentes et lisibles d’un endroit à l’autre. Si elles se contredisent, elle passe au suivant.',
  ],

  coutTitre: 'Une absence qui ne fait aucun bruit.',
  coutIntro:
    'Un cabinet ne voit jamais les patients qu’il n’a pas eus. Pas d’appel manqué, pas de créneau annulé : la demande est simplement allée ailleurs, et rien dans l’agenda ne le signale.',
  acteLourd: {
    actesCourants: 'Pour un détartrage, le patient prend le cabinet le plus proche.',
    actesLourds:
      'Pour un implant, une réhabilitation ou un traitement d’orthodontie adulte, il cherche, il compare, il lit.',
    enjeu:
      'Un plan de traitement de ce type représente plusieurs milliers d’euros. Ce sont exactement les actes pour lesquels les IA sont consultées.',
  },
  plateformeCaptive:
    'une plateforme de prise de rendez-vous, qui capte le patient avant vous et vous le revend sous forme d’abonnement',
  variablesDuCalcul:
    'votre nombre de nouveaux patients par mois, votre part d’actes lourds, votre panier moyen',

  problemesTitre: 'Ce qu’on trouve le plus souvent sur le site d’un cabinet.',
  problemesIntro:
    'Ce ne sont presque jamais de gros travaux. Ce sont des réglages oubliés, souvent hérités de la mise en ligne du site il y a cinq ans.',
  problemesSource: 'Relevé sur des cabinets que nous avons analysés.',
  problemes: [
    {
      titre: 'La page « À propos » est invisible pour les moteurs',
      corps:
        'Beaucoup de sites contiennent une instruction cachée qui demande aux moteurs de recherche de ne pas enregistrer certaines pages. Elle est utile pendant la construction du site, et on oublie de la retirer. Résultat : la page qui présente le praticien, son parcours et ses diplômes — exactement ce qu’une IA cherche pour décider si elle peut vous recommander — n’est lue par personne.',
    },
    {
      titre: 'Le site ne dit nulle part, en clair, qui vous êtes',
      corps:
        'Un site peut afficher votre nom, votre adresse et vos horaires à l’écran sans qu’aucune machine ne sache les reconnaître. Il existe un format standard, invisible pour vos visiteurs, qui étiquette ces informations pour que les moteurs et les IA les lisent sans ambiguïté : ceci est le nom du praticien, ceci son adresse, ceci sa spécialité. La grande majorité des sites de cabinets n’en ont aucun. Pour une IA, le cabinet est alors une page de texte parmi d’autres, pas un praticien identifié.',
    },
    {
      titre: 'Une page de contenu, quand les confrères en publient trente',
      corps:
        'Un cabinet cité par les IA a généralement une page par acte : l’implant, la couronne, la parodontie, l’urgence, le blanchiment — avec le déroulé, la durée, les suites, l’ordre de prix. Un cabinet absent a souvent une seule page « Nos soins » qui liste tout en dix lignes. Une IA cite ce qu’elle peut lire ; sur un sujet où vous n’avez rien écrit, elle cite celui qui a écrit.',
    },
    {
      titre: 'Les informations se contredisent d’un endroit à l’autre',
      corps:
        'Horaires du site différents de ceux de la fiche de rendez-vous, adresse d’avant le déménagement dans un annuaire, associé parti depuis deux ans encore présent. Une IA qui rencontre deux versions écarte le cabinet plutôt que de risquer l’erreur — et quand elle ne l’écarte pas, elle diffuse la mauvaise information.',
    },
  ],

  ctaTitre: 'Vérifiez ce que les IA disent de votre cabinet.',
  ctaCorps:
    'L’audit express prend une dizaine de secondes. Ni inscription, ni carte bancaire : vous entrez l’adresse de votre site, vous voyez immédiatement où vous en êtes.',

  cadreReglementaire: {
    titre: 'Et le cadre déontologique ?',
    corps:
      'Depuis le décret du 22 décembre 2020, un praticien peut communiquer au public des informations sur son exercice, à condition qu’elles soient exactes, vérifiables et sans caractère promotionnel ou comparatif. GEOMIND ne rédige aucune publicité et n’établit aucun classement de praticiens : il vérifie que vos informations factuelles sont présentes, cohérentes et lisibles. Ce que vous publiez reste sous votre responsabilité.',
  },

  faq: [
    {
      q: 'Est-ce compatible avec les règles de communication des professionnels de santé ?',
      a: 'Oui. Depuis le décret du 22 décembre 2020, un praticien peut communiquer au public des informations sur son exercice, à condition qu’elles soient exactes, vérifiables et sans caractère promotionnel ou comparatif. GEOMIND ne rédige aucune publicité et n’établit aucun classement de praticiens : il vérifie que vos informations factuelles sont présentes, cohérentes et lisibles. Ce que vous publiez reste sous votre responsabilité.',
    },
    {
      q: 'J’ai déjà une fiche de prise de rendez-vous et une fiche Google. Ça ne suffit pas ?',
      a: 'Ce sont deux sources importantes, et elles pèsent. Mais une IA en recoupe plusieurs avant de citer un nom, dont votre site. Si elles se contredisent, elle écarte le cabinet. C’est cette cohérence d’ensemble que l’analyse vérifie.',
    },
    {
      q: 'Faut-il des compétences techniques ?',
      a: 'Non. Vous entrez l’adresse de votre site. Vous recevez une liste de points à corriger en français courant, classés par priorité, avec les corrections prêtes à transmettre à la personne qui gère votre site.',
    },
    {
      q: 'Mon cabinet ne prend plus de nouveaux patients. Est-ce utile ?',
      a: 'Moins pour attirer, davantage pour l’exactitude. Une IA qui annonce de mauvais horaires ou un praticien parti génère des appels inutiles et des patients qui se déplacent pour rien.',
    },
    {
      q: 'Est-ce que ça remplace mon référencement Google ?',
      a: 'Non, les deux coexistent. Google reste le premier canal. Les IA en captent une part croissante, avec d’autres règles. GEOMIND ne mesure que cette seconde partie.',
    },
  ],
}

export const SECTEURS: SecteurConfig[] = [CABINETS_DENTAIRES]

export function getSecteur(slug: string): SecteurConfig | undefined {
  return SECTEURS.find((s) => s.slug === slug)
}
