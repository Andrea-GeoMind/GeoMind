/**
 * lib/marketing/articles.ts
 *
 * Registre des articles du blog (PLAN item 22). Source unique pour l'index
 * /blog, le sitemap et les liens internes. Le contenu vit dans
 * app/(marketing)/blog/<slug>/page.tsx.
 */

export interface TocEntry {
  /** Ancre posée sur le H2 correspondant dans le corps de l'article. */
  id: string
  label: string
}

export interface HowToStep {
  /** Ancre du H2 qui porte l'étape. */
  id: string
  name: string
  text: string
}

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  /** ISO — affichée et exposée en datePublished (Schema.org Article) */
  datePublished: string
  /** ISO — exposée en dateModified quand l'article a été revu depuis. */
  dateModified?: string
  readingMinutes: number
  /**
   * Guides à proposer en fin d'article. Renseigné par affinité de sujet ; à
   * défaut, `getRelatedArticles` tourne sur le registre — auparavant les 14
   * articles pointaient tous vers les 3 mêmes, et 4 d'entre eux n'avaient
   * aucun lien entrant.
   */
  related?: string[]
  /** Sommaire ancré — rendu sur les guides longs. */
  toc?: TocEntry[]
  /** Marche à suivre, exposée en Schema.org HowTo sur les guides « Comment… ». */
  howTo?: { name: string; steps: HowToStep[] }
  /** Bloc « À retenir » de fin d'article — le passage le plus repris en citation. */
  takeaways?: string[]
}

export const ARTICLES: ArticleMeta[] = [
  {
    slug: 'choisir-outil-visibilite-ia',
    toc: [
      {
        id: 'pourquoi-un-outil-plutot-que-le-faire',
        label: 'Pourquoi un outil plutôt que le faire à la main',
      },
      { id: 'les-6-criteres-qui-comptent-vraiment', label: 'Les 6 critères qui comptent vraiment' },
      { id: 'les-pieges-a-eviter', label: 'Les pièges à éviter' },
      {
        id: 'les-questions-a-poser-avant-de-vous-engager',
        label: 'Les questions à poser avant de vous engager',
      },
      { id: 'et-geomind-dans-tout-ca', label: 'Et GeoMind dans tout ça ?' },
      { id: 'en-resume', label: 'En résumé' },
    ],
    howTo: {
      name: 'Choisir un outil de visibilité IA',
      steps: [
        {
          id: 'pourquoi-un-outil-plutot-que-le-faire',
          name: 'Pourquoi un outil plutôt que le faire à la main',
          text: 'Décidez si un outil se justifie, ou si un relevé manuel suffit à votre volume.',
        },
        {
          id: 'les-6-criteres-qui-comptent-vraiment',
          name: 'Les 6 critères qui comptent vraiment',
          text: 'Passez les 6 critères qui comptent vraiment : moteurs couverts, neutralité des prompts, recommandations, historique, prix, langue.',
        },
        {
          id: 'les-pieges-a-eviter',
          name: 'Les pièges à éviter',
          text: 'Écartez les pièges classiques, à commencer par les scores instantanés invérifiables.',
        },
        {
          id: 'les-questions-a-poser-avant-de-vous-engager',
          name: 'Les questions à poser avant de vous engager',
          text: 'Posez les questions qui engagent le fournisseur avant de signer.',
        },
      ],
    },
    related: [
      'suivre-citations-ia',
      'quest-ce-que-le-geo',
      'savoir-si-chatgpt-parle-de-mon-entreprise',
    ],
    title: 'Comment choisir un outil de visibilité IA (GEO) en 2026',
    description:
      'Suivi des citations, audit technique, recommandations, prix : les critères pour choisir un outil de visibilité dans les IA, et les questions à poser avant de vous engager.',
    datePublished: '2026-06-16',
    readingMinutes: 8,
  },
  {
    slug: 'entreprise-pas-citee-chatgpt',
    takeaways: [
      'La cause la plus fréquente est la plus simple : ChatGPT ne connaît pas encore votre entreprise.',
      "Vérifiez d'abord que votre site n'interdit pas l'accès aux robots des IA.",
      "Sans existence hors de votre site, les IA n'ont rien pour recouper ce que vous affirmez.",
      'Un mauvais test donne une fausse réponse : un prompt qui cite votre marque ne mesure pas votre visibilité.',
    ],
    related: [
      'erreurs-geo-frequentes',
      'comment-etre-cite-par-chatgpt',
      'savoir-si-chatgpt-parle-de-mon-entreprise',
    ],
    title: 'Mon entreprise n’apparaît pas dans ChatGPT : que faire ?',
    description:
      'Vous avez demandé à ChatGPT et c’est un concurrent qui sort ? Voici les 6 causes les plus fréquentes et comment y remédier, étape par étape.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'apparaitre-dans-gemini',
    howTo: {
      name: 'Apparaître dans Google Gemini',
      steps: [
        {
          id: 'votre-socle-un-seo-google-solide',
          name: 'Votre socle : un SEO Google solide',
          text: "Consolidez votre SEO Google : Gemini s'appuie sur l'index et les signaux d'autorité de Google.",
        },
        {
          id: 'les-donnees-structurees-langage-natif-de-google',
          name: 'Les données structurées, langage natif de Google',
          text: 'Ajoutez les données structurées Schema.org, le langage natif de Google.',
        },
        {
          id: 'google-business-profile-decisif-pour-le-local',
          name: 'Google Business Profile : décisif pour le local',
          text: 'Complétez votre fiche Google Business Profile, décisive pour les requêtes locales.',
        },
        {
          id: 'du-contenu-qui-repond-aux-questions',
          name: 'Du contenu qui répond aux questions',
          text: 'Publiez du contenu qui répond directement aux questions de vos clients.',
        },
      ],
    },
    takeaways: [
      "Gemini s'appuie sur l'index et les signaux d'autorité de Google : un SEO solide reste le socle.",
      "Les données structurées Schema.org sont le langage natif de Google — c'est là qu'elles rapportent le plus.",
      'Pour une activité locale, la fiche Google Business Profile est décisive.',
      'Gemini, ChatGPT et Perplexity ne choisissent pas leurs sources de la même façon : ne pariez pas sur un seul moteur.',
    ],
    related: ['apparaitre-google-ai-overviews', 'fichiers-qui-parlent-aux-ia', 'geo-vs-seo'],
    title: 'Comment apparaître dans Google Gemini',
    description:
      'Gemini s’appuie sur l’index de Google et ses signaux d’autorité. Voici comment fonctionne son choix de sources et comment devenir l’une d’elles.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'suivre-citations-ia',
    toc: [
      {
        id: 'pourquoi-un-score-instantane-ne-veut-rien-dire',
        label: 'Pourquoi un score instantané ne veut rien dire',
      },
      { id: 'quoi-suivre-exactement', label: 'Quoi suivre exactement' },
      {
        id: 'comment-mettre-en-place-un-suivi-fiable',
        label: 'Comment mettre en place un suivi fiable',
      },
      { id: 'a-la-main-ou-avec-un-outil', label: 'À la main ou avec un outil' },
      { id: 'transformer-le-suivi-en-actions', label: 'Transformer le suivi en actions' },
      { id: 'par-ou-commencer', label: 'Par où commencer' },
    ],
    howTo: {
      name: 'Suivre ses citations dans les IA',
      steps: [
        {
          id: 'quoi-suivre-exactement',
          name: 'Quoi suivre exactement',
          text: 'Déterminez quoi suivre : les questions de vos clients, pas votre nom de marque.',
        },
        {
          id: 'comment-mettre-en-place-un-suivi-fiable',
          name: 'Comment mettre en place un suivi fiable',
          text: 'Mettez en place un suivi fiable, avec les mêmes prompts répétés dans le temps.',
        },
        {
          id: 'a-la-main-ou-avec-un-outil',
          name: 'À la main ou avec un outil',
          text: 'Choisissez entre relevé manuel et outil selon le nombre de prompts à tenir.',
        },
        {
          id: 'transformer-le-suivi-en-actions',
          name: 'Transformer le suivi en actions',
          text: 'Transformez le suivi en actions : corrigez ce que les réponses révèlent.',
        },
      ],
    },
    takeaways: [
      "Un score instantané ne veut rien dire : les IA ne répondent jamais deux fois exactement pareil. C'est la tendance qui compte.",
      'Suivez les questions que posent vos clients, jamais votre nom de marque — un prompt qui contient votre marque fausse la mesure.',
      'Gardez les mêmes prompts dans le temps : sans stabilité, vous comparez des choses différentes.',
      "Le suivi n'a d'intérêt que s'il déclenche des corrections : c'est ce que révèlent les réponses qui vaut le relevé.",
    ],
    related: [
      'savoir-si-chatgpt-parle-de-mon-entreprise',
      'choisir-outil-visibilite-ia',
      'entreprise-pas-citee-chatgpt',
    ],
    title: 'Comment suivre ses citations dans les IA (et pourquoi c’est crucial)',
    description:
      'Être cité par les IA, ça se mesure. Pourquoi suivre une tendance plutôt qu’un score, quoi surveiller, et comment mettre en place un suivi fiable.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'quest-ce-que-le-geo',
    related: ['geo-vs-seo', 'comment-etre-cite-par-chatgpt', 'fichiers-qui-parlent-aux-ia'],
    title: 'Qu’est-ce que le GEO (Generative Engine Optimization) ?',
    description:
      'Définition simple du GEO, pourquoi il devient incontournable face à ChatGPT et Perplexity, et en quoi il diffère du SEO classique — expliqué pour les dirigeants de TPE et PME.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'etre-visible-perplexity',
    howTo: {
      name: 'Apparaître dans les réponses de Perplexity',
      steps: [
        {
          id: 'comment-perplexity-choisit-ses-sources',
          name: 'Comment Perplexity choisit ses sources',
          text: "Comprenez comment Perplexity sélectionne ses sources avant d'optimiser quoi que ce soit.",
        },
        {
          id: 'ce-qui-vous-rend-citable-par-perplexity',
          name: 'Ce qui vous rend « citable » par Perplexity',
          text: 'Rendez vos pages citables : réponse courte en tête, faits vérifiables, structure claire.',
        },
        {
          id: 'les-erreurs-qui-vous-excluent',
          name: 'Les erreurs qui vous excluent',
          text: "Corrigez les erreurs qui vous excluent d'emblée, à commencer par le blocage des robots.",
        },
        {
          id: 'la-presence-hors-de-votre-site-compte',
          name: 'La présence hors de votre site compte',
          text: 'Construisez une présence hors de votre site, que Perplexity puisse recouper.',
        },
        {
          id: 'comment-mesurer-votre-presence-dans-perplexity',
          name: 'Comment mesurer votre présence dans Perplexity',
          text: 'Mesurez votre présence dans Perplexity pour savoir où vous en êtes.',
        },
      ],
    },
    takeaways: [
      "Perplexity cite peu de sources par réponse : y figurer ou être invisible, il n'y a pas d'entre-deux.",
      "Une page citable annonce sa réponse dès les premières lignes et l'appuie sur des faits vérifiables.",
      "Bloquer les robots des IA, même par accident, vous exclut d'emblée — c'est la première chose à vérifier.",
      'Votre présence hors de votre site pèse lourd : Perplexity recoupe plusieurs sources avant de vous nommer.',
    ],
    related: [
      'comment-etre-cite-par-chatgpt',
      'apparaitre-dans-gemini',
      'fichiers-qui-parlent-aux-ia',
    ],
    title: 'Comment apparaître dans les réponses de Perplexity',
    description:
      'Perplexity cite ses sources, ligne par ligne. Voici comment fonctionne son moteur et les actions concrètes pour que votre site fasse partie des sources citées.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'savoir-si-chatgpt-parle-de-mon-entreprise',
    howTo: {
      name: 'Savoir si ChatGPT parle de votre entreprise',
      steps: [
        {
          id: 'methode-manuelle-en-15-minutes',
          name: 'Méthode manuelle, en 15 minutes',
          text: 'Testez à la main en 15 minutes : posez à ChatGPT les questions de vos clients, sans citer votre marque.',
        },
        {
          id: 'les-pieges-du-test-manuel',
          name: 'Les pièges du test manuel',
          text: 'Évitez les pièges du test manuel — prompt orienté, historique de conversation, variabilité des réponses.',
        },
        {
          id: 'que-faire-si-ce-sont-vos-concurrents',
          name: 'Que faire si ce sont vos concurrents qui apparaissent',
          text: 'Si ce sont vos concurrents qui apparaissent, analysez ce qui les rend citables.',
        },
        {
          id: 'faire-ca-a-la-main-ou-avec',
          name: 'Faire ça à la main ou avec un outil',
          text: 'Passez à un suivi régulier, à la main ou avec un outil, pour voir une tendance.',
        },
      ],
    },
    takeaways: [
      'Le test manuel prend 15 minutes : posez les questions de vos clients, sans jamais citer votre marque.',
      'Attention aux pièges — un prompt orienté, un historique de conversation ou une seule tentative donnent une fausse lecture.',
      'Si ce sont vos concurrents qui sortent, regardez ce qui les rend citables plutôt que ce qui vous manque.',
      "Un test unique ne dit rien ; c'est la répétition dans le temps qui révèle votre position réelle.",
    ],
    related: [
      'suivre-citations-ia',
      'entreprise-pas-citee-chatgpt',
      'comment-etre-cite-par-chatgpt',
    ],
    title: 'Comment savoir si ChatGPT parle de votre entreprise',
    description:
      'La méthode pas à pas pour tester, à la main ou avec un outil, si les IA citent votre entreprise — et quoi faire quand ce sont vos concurrents qui apparaissent à votre place.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'geo-commerce-local',
    toc: [
      {
        id: 'comment-les-ia-repondent-aux-recherches-locales',
        label: 'Comment les IA répondent aux recherches locales',
      },
      {
        id: 'le-socle-votre-fiche-google-business-profile',
        label: 'Le socle : votre fiche Google Business Profile',
      },
      { id: 'les-avis-clients-carburant-des-ia', label: 'Les avis clients, carburant des IA' },
      {
        id: 'les-annuaires-et-plateformes-qui-comptent',
        label: 'Les annuaires et plateformes qui comptent',
      },
      {
        id: 'votre-site-les-pages-qui-declenchent-une-citation',
        label: 'Votre site : les pages qui déclenchent une citation',
      },
      { id: 'exemple-concret', label: 'Exemple concret' },
      { id: 'plan-d-action-local', label: "Plan d'action local" },
    ],
    takeaways: [
      'En local, la fiche Google Business Profile est le socle : catégorie exacte, horaires, adresse et téléphone cohérents partout.',
      'Les avis clients sont le carburant principal — leur nombre, leur fraîcheur et leurs mots comptent autant que leur note.',
      'Les annuaires de votre secteur valent le détour : les IA les recoupent pour vérifier que vous existez vraiment.',
      "Sur votre site, une page par prestation et par zone desservie déclenche plus de citations qu'une page « Services » générique.",
    ],
    related: ['geo-ecommerce', 'comment-etre-cite-par-chatgpt', 'erreurs-geo-frequentes'],
    title: 'GEO local : être recommandé par les IA près de chez vous',
    description:
      'Restaurants, artisans, commerces, professions libérales : comment devenir la réponse des IA quand un client cherche un professionnel dans votre ville.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'apparaitre-google-ai-overviews',
    howTo: {
      name: 'Apparaître dans les AI Overviews de Google',
      steps: [
        {
          id: 'd-ou-google-tire-ses-sources',
          name: "D'où Google tire ses sources",
          text: "Identifiez d'où Google tire les sources de ses AI Overviews.",
        },
        {
          id: 'ce-qui-augmente-vos-chances-d-etre-cite',
          name: "Ce qui augmente vos chances d'être cité",
          text: "Travaillez ce qui augmente vos chances d'être cité : clarté, structure, autorité.",
        },
        {
          id: 'le-paradoxe-du-zero-clic-et-comment',
          name: 'Le paradoxe du « zéro clic » et comment en tirer parti',
          text: 'Tirez parti du zéro clic en soignant la mention de marque plutôt que le seul trafic.',
        },
      ],
    },
    takeaways: [
      'Un AI Overview est la réponse rédigée affichée au-dessus des liens : y être cité offre une visibilité maximale.',
      'Google y puise dans son propre index : ce qui vous fait remonter en SEO vous rend éligible aux AI Overviews.',
      "Le zéro clic n'est pas une fatalité — la mention de votre marque dans la réponse a une valeur propre.",
      'Les AI Overviews et les moteurs de réponse se travaillent ensemble, avec des logiques complémentaires.',
    ],
    related: ['apparaitre-dans-gemini', 'geo-vs-seo', 'quest-ce-que-le-geo'],
    title: 'Comment apparaître dans les AI Overviews de Google',
    description:
      'Google répond désormais directement en haut de ses résultats avec l’IA. Voici comment fonctionnent les AI Overviews et comment devenir une de leurs sources.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'geo-ecommerce',
    toc: [
      {
        id: 'comment-les-ia-recommandent-des-produits',
        label: 'Comment les IA recommandent des produits',
      },
      {
        id: 'vos-fiches-produits-ce-qui-les-rend-citables',
        label: 'Vos fiches produits : ce qui les rend citables',
      },
      {
        id: 'le-contenu-editorial-qui-declenche-les-citations',
        label: 'Le contenu éditorial qui déclenche les citations',
      },
      { id: 'la-preuve-sociale-et-les-avis', label: 'La preuve sociale et les avis' },
      { id: 'les-erreurs-frequentes-en-e-commerce', label: 'Les erreurs fréquentes en e-commerce' },
      { id: 'plan-d-action-e-commerce', label: "Plan d'action e-commerce" },
    ],
    takeaways: [
      'Les IA ne classent pas des boutiques : elles recommandent des produits nommés, en recoupant fiches, contenus éditoriaux et avis.',
      'Une fiche produit citable donne des faits vérifiables — matière, dimensions, compatibilité, prix — pas des arguments marketing.',
      'Les avis et la preuve sociale pèsent autant que votre propre site : les IA cherchent une confirmation ailleurs que chez vous.',
      'Commencez par les quelques produits qui font votre chiffre, pas par le catalogue entier.',
    ],
    related: ['geo-commerce-local', 'comment-etre-cite-par-chatgpt', 'erreurs-geo-frequentes'],
    title: 'GEO pour le e-commerce : faire recommander vos produits par les IA',
    description:
      'Quand un client demande à une IA « quel est le meilleur produit pour… », comment faire en sorte que ce soit le vôtre qui soit cité ? Le guide GEO pour les boutiques en ligne.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'erreurs-geo-frequentes',
    takeaways: [
      'Un robots.txt qui bloque GPTBot ou les robots IA annule tout le reste du travail.',
      "Un contenu vague n'est pas citable : les IA reprennent ce qui est net, daté et vérifiable.",
      "Des informations incohérentes d'une source à l'autre font douter les IA et coûtent des citations.",
      'Ne rien mesurer est la septième erreur, et celle qui empêche de corriger les six autres.',
    ],
    related: ['fichiers-qui-parlent-aux-ia', 'entreprise-pas-citee-chatgpt', 'quest-ce-que-le-geo'],
    title: 'Les 7 erreurs GEO qui vous rendent invisible dans les IA',
    description:
      'Robots.txt qui bloque, contenu vague, infos incohérentes… les erreurs les plus courantes qui empêchent les IA de citer votre entreprise — et comment les corriger.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'comment-etre-cite-par-chatgpt',
    howTo: {
      name: 'Être cité par ChatGPT',
      steps: [
        {
          id: 'verifiez-que-les-ia-peuvent-lire-votre-site',
          name: '1. Vérifiez que les IA peuvent lire votre site',
          text: "Vérifiez que votre robots.txt et votre hébergeur laissent passer GPTBot : sans accès, aucune citation n'est possible.",
        },
        {
          id: 'repondez-aux-questions-que-vos-clients-posent-vraiment',
          name: '2. Répondez aux questions que vos clients posent vraiment',
          text: 'Écrivez une page par question réellement posée par vos clients, avec la réponse dès les premières lignes.',
        },
        {
          id: 'etiquetez-vos-informations-schema-org',
          name: '3. Étiquetez vos informations (Schema.org)',
          text: 'Déclarez vos informations en Schema.org (organisation, FAQ, avis) pour que les IA les extraient sans ambiguïté.',
        },
        {
          id: 'existez-ailleurs-que-chez',
          name: '4. Existez ailleurs que chez vous',
          text: 'Développez votre présence hors de votre site : annuaires, avis, mentions — les IA recoupent plusieurs sources.',
        },
        {
          id: 'mesurez-corrigez-recommencez',
          name: '5. Mesurez, corrigez, recommencez',
          text: 'Mesurez vos citations régulièrement, corrigez ce qui manque, et recommencez.',
        },
      ],
    },
    related: ['etre-visible-perplexity', 'apparaitre-dans-gemini', 'fichiers-qui-parlent-aux-ia'],
    title: 'Comment être cité par ChatGPT : le guide pour TPE et PME',
    description:
      "Les 5 actions concrètes pour qu'une IA cite votre entreprise quand un client pose une question de votre domaine — sans budget, sans jargon.",
    datePublished: '2026-06-12',
    readingMinutes: 6,
  },
  {
    slug: 'geo-vs-seo',
    related: ['quest-ce-que-le-geo', 'apparaitre-google-ai-overviews', 'erreurs-geo-frequentes'],
    title: 'GEO vs SEO : ce qui change, ce qui reste',
    description:
      "Faut-il abandonner le référencement Google pour optimiser sa visibilité dans les IA ? Non — voici comment les deux s'articulent, et par quoi commencer.",
    datePublished: '2026-06-12',
    readingMinutes: 5,
  },
  {
    slug: 'fichiers-qui-parlent-aux-ia',
    related: [
      'erreurs-geo-frequentes',
      'comment-etre-cite-par-chatgpt',
      'choisir-outil-visibilite-ia',
    ],
    title: 'llms.txt, Schema.org, FAQ : les fichiers qui parlent aux IA',
    description:
      'Trois éléments invisibles pour vos visiteurs mais décisifs pour les moteurs de réponses IA — à quoi ils servent et comment les mettre en place.',
    datePublished: '2026-06-12',
    readingMinutes: 5,
  },
]

export function getArticle(slug: string): ArticleMeta | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

/** Nombre de guides proposés en fin d'article. */
const RELATED_COUNT = 3

/**
 * Guides liés à un article : ceux qu'il désigne explicitement, complétés par
 * rotation sur le registre. La rotation garantit qu'aucun article ne se
 * retrouve sans lien entrant, quel que soit l'état des `related`.
 */
export function getRelatedArticles(slug: string): ArticleMeta[] {
  const index = ARTICLES.findIndex((a) => a.slug === slug)
  if (index === -1) return ARTICLES.slice(0, RELATED_COUNT)

  const picked: ArticleMeta[] = []
  const add = (candidate: ArticleMeta | undefined) => {
    if (!candidate) return
    if (candidate.slug === slug) return
    if (picked.some((p) => p.slug === candidate.slug)) return
    picked.push(candidate)
  }

  for (const related of ARTICLES[index].related ?? []) {
    add(ARTICLES.find((a) => a.slug === related))
  }
  for (let step = 1; picked.length < RELATED_COUNT && step <= ARTICLES.length; step += 1) {
    add(ARTICLES[(index + step) % ARTICLES.length])
  }
  return picked.slice(0, RELATED_COUNT)
}
