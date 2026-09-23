/**
 * lib/marketing/geo-tools.ts
 *
 * Source unique des données des outils GEO comparés sur le site : prix,
 * moteurs, langue, cible, points forts et faibles, sources, date du relevé.
 *
 * Deux consommateurs :
 *  - l'article /blog/meilleurs-outils-geo-2026 (tableau, fiches, ItemList,
 *    liste de sources) ;
 *  - les pages /comparatif/geomind-vs-<slug> (tableau deux colonnes, sections
 *    prix / moteurs / langue / fonctions / limites).
 *
 * Un prix qui change se corrige ICI, une seule fois. Rien de ce qui relève du
 * fait ne doit être réécrit dans le JSX d'une page ; le JSX ne porte que la
 * mise en forme et les phrases de synthèse propres à chaque page.
 *
 * Règle éditoriale (cf. l'article) : ces textes sont objectifs, les limites de
 * GeoMind sont écrites au même endroit que celles des concurrents. Un
 * comparatif où l'éditeur gagne sur tous les points n'est jamais cité.
 */

export interface GeoToolSource {
  label: string
  href: string
}

export interface GeoTool {
  /** Segment d'URL des pages de comparaison et clé de lookup. */
  slug: string
  name: string
  /** Site officiel — exposé en Schema.org ItemList. */
  website: string

  // ─── Cellules du tableau comparatif (une ligne = un outil) ────────────────
  priceSummary: string
  engineSummary: string
  language: string
  target: string

  // ─── Paragraphes des fiches et des sections ───────────────────────────────
  priceDetail: string
  engineDetail: string
  languageDetail: string
  audienceDetail: string

  /** Un seul élément = rendu en paragraphe ; plusieurs = rendu en liste. */
  strengths: string[]
  weaknesses: string[]

  /**
   * Fonctions concrètes, pour la section « Fonctions » des pages de
   * comparaison. Renseigné uniquement pour les outils qui ont une page vs —
   * on n'invente pas de liste de fonctions pour un outil qu'on n'affiche
   * nulle part.
   */
  features?: string[]

  /** Une phrase — Schema.org ItemList de l'article comparatif. */
  itemListDescription: string
  sources: GeoToolSource[]
}

/** Date du relevé des prix, affichée partout où un tarif apparaît. */
export const GEO_TOOLS_CHECKED_ON = '2026-09-23'
export const GEO_TOOLS_CHECKED_ON_LABEL = '23 septembre 2026'

/**
 * Ordre alphabétique volontaire : trier par prix ou par « note » placerait
 * GeoMind en tête du tableau, et c'est exactement ce qu'un lecteur ne
 * croirait pas.
 */
export const GEO_TOOLS: GeoTool[] = [
  {
    slug: 'ahrefs',
    name: 'Ahrefs Brand Radar',
    website: 'https://ahrefs.com/brand-radar',
    priceSummary: 'Inclus dans tout plan Ahrefs payant (dès 119 €) · 199 $/mois en autonome',
    engineSummary: 'AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini, Copilot, Claude (7)',
    language: 'Français disponible',
    target: 'Équipes SEO',
    priceDetail:
      'Deux produits sous le même nom. Les « Custom Prompts » — vos propres questions suivies — sont inclus dans tout plan Ahrefs payant (Lite à 119 €/mois depuis la France), vendus à partir de 50 $/mois seuls, ou 699 $/mois pour tous les modèles. L’« AI Visibility Index » — 83 questions par jour, 2 500 relevés par mois — coûte 199 $/mois et s’achète sans abonnement Ahrefs, avec un dépassement facturé 0,02 $ le relevé. Curiosité de facturation : les plans Ahrefs s’affichent en euros pour un visiteur français, mais le module Brand Radar reste libellé en dollars.',
    engineDetail:
      'Google AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini et Copilot. Claude est désormais accessible sur l’AI Visibility Index, qui annonce « toutes les plateformes, Claude compris » ; sur les questions personnalisées, un relevé Claude consomme 8 vérifications au lieu d’une.',
    languageDetail: 'Interface disponible en français — Ahrefs est traduit en douze langues.',
    audienceDetail: 'Les équipes SEO, en priorité celles déjà abonnées à Ahrefs.',
    strengths: [
      'L’adossement à l’index Ahrefs : vous croisez la visibilité IA avec le trafic, les backlinks et la demande de recherche, et le module suit aussi YouTube, TikTok et Reddit. Si vous payez déjà Ahrefs, le suivi de vos questions est déjà là.',
    ],
    weaknesses: [
      'La lisibilité du prix. On lit encore partout un « 828 $/mois tout compris » qui correspond à une grille antérieure, et la grille actuelle mélange deux produits, deux devises et un compteur de vérifications où un relevé Claude coûte huit fois un relevé Perplexity. Il faut lire attentivement pour savoir ce qu’on achète.',
    ],
    itemListDescription:
      'Module de visibilité IA d’Ahrefs sur six moteurs plus Claude, inclus dans tout plan Ahrefs payant (dès 119 €/mois) ou 199 $/mois en abonnement autonome. Interface disponible en français.',
    sources: [
      { label: 'ahrefs.com/brand-radar', href: 'https://ahrefs.com/brand-radar' },
      {
        label: 'help.ahrefs.com — changer la langue de l’interface',
        href: 'https://help.ahrefs.com/fr/articles/852478-comment-puis-je-changer-la-langue-de-l-interface-ahrefs',
      },
    ],
  },
  {
    slug: 'chatseo',
    name: 'ChatSEO',
    website: 'https://chatseo.app',
    priceSummary: '29 €/mois (23 € en annuel)',
    engineSummary: 'Aucun suivi moteur par moteur — le GEO est l’un des 12 agents du chatbot',
    language: 'Français',
    target: 'Fondateurs solos, consultants, petites agences',
    priceDetail:
      'Starter à 29 €/mois (23 € en annuel, 278 € l’an) pour 100 crédits et un site connecté, Pro à 49 € (39 €, 470 €) pour 200 crédits, trois sites et l’accès API et MCP, Ranker à 79 € (63 €, 758 €) pour 400 crédits et dix sites, plus un plan sur mesure. Un crédit égale un message envoyé. Essai avec 30 crédits offerts, sans carte bancaire.',
    engineDetail:
      'Ce n’est pas un outil de suivi des citations moteur par moteur : sa page de tarifs ne nomme aucun moteur de réponse. Le GEO y est l’un des douze agents du chatbot — « GEO (être cité par les IA) » — aux côtés de la recherche de mots-clés, du maillage interne ou du SEO local.',
    languageDetail: 'Interface, agents et support en français.',
    audienceDetail:
      'Les fondateurs solos et consultants qui veulent des actions concrètes sans ouvrir un tableau de bord SEO ; la formule Ranker vise les agences multi-sites.',
    strengths: [
      'Le format : on discute avec un agent connecté à votre Search Console plutôt que de lire un tableau de bord, et les douze agents couvrent la chaîne complète — mots-clés, on-page, maillage, backlinks, SEO local, données structurées — dont un agent GEO. Accès API et MCP dès le plan Pro à 49 €, et publication directe sur WordPress ou Webflow.',
    ],
    weaknesses: [
      'Ce n’est pas un outil de mesure de la visibilité IA : rien sur sa page de tarifs n’indique qu’il interroge ChatGPT, Perplexity ou Claude pour savoir s’ils vous citent, ni qu’il suive une tendance moteur par moteur. Le GEO y est un sujet de conseil, pas une mesure. Et la facturation au message — un crédit par message envoyé — rend le coût réel dépendant de votre façon de dialoguer.',
    ],
    features: [
      '12 agents SEO dans un chatbot, dont un agent GEO',
      'Connexion Google Search Console (Google Analytics à partir du plan Pro)',
      'Accès API et MCP à partir du plan Pro (49 €)',
      'Publication directe sur WordPress et Webflow',
    ],
    itemListDescription:
      'Assistant SEO français en chatbot connecté à la Search Console, à partir de 29 €/mois, avec un agent GEO parmi ses douze agents. Interface en français.',
    sources: [{ label: 'chatseo.app/fr/tarifs', href: 'https://chatseo.app/fr/tarifs' }],
  },
  {
    slug: 'geomind',
    name: 'GeoMind',
    website: 'https://geomind.fr',
    priceSummary: 'Gratuit (1 site) · plans payants en liste d’attente',
    engineSummary: 'ChatGPT, Claude, Gemini, Perplexity (4)',
    language: 'Français',
    target: 'TPE et PME françaises',
    priceDetail:
      'Le plan Gratuit est le seul ouvert aujourd’hui : 1 site et 1 000 crédits de bienvenue, non renouvelés — une analyse complète coûte 400 crédits, donc deux analyses et quelques questions au coach, sans carte bancaire. Les plans payants sont annoncés à 19 €/mois (Solo, 2 sites), 59 € (Pro, 5 sites) et 149 € (Business, 15 sites), mais ils ne sont pas encore en vente : on s’inscrit sur une liste d’attente.',
    engineDetail:
      'ChatGPT, Claude, Gemini et Perplexity, sur tous les plans, plan gratuit compris. Pas de Google AI Overviews, pas d’AI Mode, pas de Copilot.',
    languageDetail: 'Interface, questions générées et recommandations en français.',
    audienceDetail: 'Les TPE et PME françaises sans équipe marketing.',
    strengths: [
      'Le plan gratuit va jusqu’au bout d’une analyse complète, sans carte bancaire, et couvre Claude — que la plupart des concurrents facturent en option ou réservent à leurs contrats. Les questions sont générées dans la langue de vos clients, et chaque problème détecté vient avec une fiche qui explique quoi faire, en français.',
    ],
    weaknesses: [
      'Les plans payants ne sont pas encore ouverts : seul le plan gratuit est disponible, le reste est en liste d’attente. Si vous cherchez un outil à déployer sur plusieurs sites dès maintenant, ce n’est pas le bon moment.',
      '10 questions par analyse, là où les concurrents en suivent 15 à 400.',
      'Suivi hebdomadaire sur les plans payants une fois ouverts, pas quotidien : un relevé automatique chaque lundi sur un échantillon de 3 questions, et un relevé mensuel sur le plan gratuit. Les analyses complètes se lancent à la demande.',
      'Pas de Google AI Overviews ni d’AI Mode — les réponses IA qui s’affichent directement dans Google.',
      'Pas d’API, pas de connecteur Looker Studio, pas de suivi des robots IA dans les logs ni du trafic référent venu des assistants.',
      'France et français uniquement : pas de multi-pays, pas de multi-langue.',
      'Un produit jeune, sans le recul de plusieurs années de données.',
    ],
    features: [
      '4 moteurs interrogés à chaque analyse : ChatGPT, Claude, Gemini, Perplexity',
      'Audit technique et éditorial du site, avec une fiche de correction par problème',
      'Coach IA et recommandations en français',
      'Suivi hebdomadaire automatique (plans payants, à leur ouverture) — mensuel sur le plan gratuit',
    ],
    itemListDescription:
      'Outil français d’audit de visibilité IA sur ChatGPT, Claude, Gemini et Perplexity. Plan gratuit disponible pour un site ; plans payants annoncés de 19 à 149 €/mois, en liste d’attente. Interface et recommandations en français.',
    sources: [{ label: 'geomind.fr/pricing', href: 'https://geomind.fr/pricing' }],
  },
  {
    slug: 'geotoolbox',
    name: 'GEO Toolbox',
    website: 'https://geotoolbox.ai',
    priceSummary: '99 €/mois (−20 % en annuel)',
    engineSummary:
      '3 moteurs au plan d’entrée, 5 au choix à partir de Plus, les 8 sur Pro (ChatGPT, Perplexity, AI Overviews, AI Mode, Gemini, Copilot, Claude, Grok)',
    language: 'Anglais',
    target: 'Marques, consultants, agences',
    priceDetail:
      'Starter à 99 €/mois (1 marque, 50 questions, 3 moteurs), Plus à 199 € (jusqu’à 3 marques, 100 questions mutualisées, 5 moteurs au choix), Pro à 399 € (jusqu’à 5 marques, 150 questions, les 8 moteurs), plus un palier Growth et une grille agences. Facturation annuelle à −20 %. Essai de 7 jours sur les plans payants ; trois des dix outils gratuits tournent sur votre domaine sans inscription ni carte bancaire. Les mêmes montants sont libellés en dollars sur la version anglaise du site : c’est la page française qui fait foi pour un acheteur français.',
    engineDetail:
      'Huit au total — ChatGPT, Perplexity, Google AI Overviews, Google AI Mode, Gemini, Bing Copilot, Claude et Grok — mais trois seulement au plan Starter, cinq au choix à partir de Plus, les huit sur Pro. Le coût en crédits varie selon le moteur : 1 pour Perplexity, 4 pour ChatGPT, 8 pour Gemini, 20 pour Claude, 31 pour Grok.',
    languageDetail:
      'Site traduit en français (tarifs et blog compris), interface produit en anglais.',
    audienceDetail:
      'Les marques et consultants qui suivent une à cinq marques, avec une grille séparée pour les agences.',
    strengths: [
      'Un pool de crédits unique pour quatorze outils — suivi, scans ponctuels, analyse de contenu — plutôt que des quotas séparés, et trois outils gratuits qui tournent sur votre domaine sans inscription : score de préparation aux IA, vérification des robots IA, et un scan d’accessibilité testé contre 34 robots.',
    ],
    weaknesses: [
      'Trois moteurs seulement au plan d’entrée à 99 €, et les moteurs les plus chers en crédits — Claude à 20, Grok à 31 — épuisent vite le pool : la couverture annoncée sur huit moteurs suppose en pratique le plan Pro à 399 €. Pas de plan gratuit permanent non plus : un essai de 7 jours, et trois outils ponctuels.',
    ],
    features: [
      'Suivi hebdomadaire des citations et de la part de voix',
      'Pool de crédits unique pour 14 outils, au coût variable selon le moteur',
      'Connexion Google Search Console et Google Analytics',
      'Trois outils gratuits sans inscription, dont un scan des robots IA sur 34 bots',
    ],
    itemListDescription:
      'Plateforme de visibilité IA sur huit moteurs à partir de 99 €/mois, avec un pool de crédits unique pour quatorze outils et trois outils gratuits sans inscription. Interface en anglais, site traduit en français.',
    sources: [{ label: 'geotoolbox.ai/fr/pricing', href: 'https://geotoolbox.ai/fr/pricing' }],
  },
  {
    slug: 'ia-rank',
    name: 'ia-rank.com',
    website: 'https://ia-rank.com',
    priceSummary: '9 € la 1re semaine, puis 99 €/mois',
    engineSummary: 'ChatGPT, Gemini, Claude, Perplexity (4 annoncés)',
    language: 'Français',
    target: 'TPE, commerces locaux',
    priceDetail:
      '9 € la première semaine, puis 99 €/mois sans engagement (« Flexibilité ») ou 82,50 €/mois facturés 990 € à l’année (« Visibility Pro »).',
    engineDetail: 'ChatGPT, Gemini, Claude et Perplexity sont annoncés.',
    languageDetail: 'Site en français.',
    audienceDetail:
      'Les TPE et les commerces locaux — serruriers, plombiers, avocats, restaurants, médecins.',
    strengths: [
      'Un tarif clair, en euros, sans engagement, avec une semaine d’essai à 9 €. L’offre comprend un audit initial, un rapport mensuel et un support par e-mail — c’est à mi-chemin entre l’outil et la prestation.',
    ],
    weaknesses: [
      'Au moment du relevé, le site ne montre ni capture de l’interface, ni méthodologie de mesure, ni exemple de rapport. Vous ne savez pas, avant de payer, combien de questions sont posées ni comment la visibilité est calculée. La promesse d’un taux de conversion « 9 fois meilleur que Google » n’est pas sourcée. À tester sur la semaine d’essai avant tout engagement.',
    ],
    features: [
      'Audit initial de la visibilité IA inclus',
      'Rapport mensuel (Flexibilité) ou hebdomadaire (Visibility Pro)',
      'Support par e-mail, prioritaire sous 24 h sur l’offre Pro',
      'Aucune interface produit visible publiquement au moment du relevé',
    ],
    itemListDescription:
      'Offre française d’optimisation de la visibilité IA à 99 €/mois sans engagement, quatre moteurs annoncés, livrée sous forme de rapports mensuels.',
    sources: [{ label: 'ia-rank.com/tarifs', href: 'https://ia-rank.com/tarifs' }],
  },
  {
    slug: 'meteoria',
    name: 'Meteoria',
    website: 'https://meteoria.ai',
    priceSummary: '75 €/mois',
    engineSummary:
      '3 au choix parmi 8 annoncés (ChatGPT, AI Overviews, AI Mode, Gemini, Perplexity, Grok, Copilot, Claude)',
    language: 'Français',
    target: 'PME, agences, grands comptes',
    priceDetail:
      'Starter à 75 €/mois pour 25 questions relevées chaque jour, Pro à 175 € (100 questions), Advanced à 420 € (300 questions), Enterprise à partir de 700 €. Deux mois offerts en annuel. Essai gratuit d’une semaine, sans carte bancaire. Sièges, projets, marques et pays illimités sur tous les plans.',
    engineDetail:
      'Huit annoncés — ChatGPT, Google AI Overviews, AI Mode, Gemini, Perplexity, Grok, Copilot et Claude — mais trois au choix par plan. Au moment du relevé, Claude figure dans la liste des huit sur une page du site et « à venir » sur une autre : vérifiez avant de le choisir.',
    languageDetail: 'Plateforme et support en français, éditeur français, hébergement en Europe.',
    audienceDetail:
      'Des PME aux grands comptes, avec des références comme Cdiscount, La Poste ou Matmut, et les agences SEO.',
    strengths: [
      'La rigueur de la mesure : chaque question est relevée quotidiennement avec 15 à 30 passes pour lisser la variabilité des réponses, là où la plupart des outils font un seul passage. Le tout en français, avec les sources citées et la corrélation au trafic via Google Analytics, Matomo ou Looker Studio.',
    ],
    weaknesses: [
      'Trois moteurs sur huit au plan d’entrée, c’est un arbitrage de plus qu’avec Qwairy au même prix. Et 25 questions à 75 €, c’est le ratio le plus serré des outils français : suffisant pour un site, pas pour un portefeuille de marques.',
    ],
    features: [
      '3 moteurs au choix parmi les 8 annoncés',
      'Relevé quotidien, avec 15 à 30 passes par question pour lisser la variabilité',
      'Sièges, projets, marques et pays illimités sur tous les plans',
      'Corrélation au trafic via Google Analytics, Matomo ou Looker Studio',
    ],
    itemListDescription:
      'Plateforme française de suivi quotidien de la visibilité IA à partir de 75 €/mois, 25 questions par jour, trois moteurs au choix parmi huit. Interface et support en français.',
    sources: [
      { label: 'meteoria.ai', href: 'https://meteoria.ai' },
      {
        label: 'meteoria.ai — Meteoria vs Qwairy (moteurs et plans)',
        href: 'https://meteoria.ai/blog/meteoria-vs-qwairy',
      },
    ],
  },
  {
    slug: 'otterly',
    name: 'Otterly.ai',
    website: 'https://otterly.ai',
    priceSummary: '29 €/mois',
    engineSummary:
      'ChatGPT, AI Overviews, Perplexity, Copilot (4) · Gemini, Claude, AI Mode en option payante',
    language: 'Anglais',
    target: 'Indépendants, petites équipes',
    priceDetail:
      'Lite à 29 €/mois (25 € en annuel), Standard à 189 €, Premium à 489 €, Enterprise sur devis. Essai gratuit sans carte bancaire, mais pas de plan gratuit permanent. La grille s’affiche en euros pour un visiteur européen — les mêmes montants sont libellés en dollars depuis les États-Unis.',
    engineDetail:
      'ChatGPT, Google AI Overviews, Perplexity et Microsoft Copilot dans tous les plans. Gemini, Google AI Mode et Claude sont des options payantes : 9 €/mois (Lite), 59 € (Standard) ou 149 € (Premium) pour Gemini ou AI Mode ; 29 €, 109 € ou 439 € pour Claude selon le plan.',
    languageDetail: 'Interface en anglais.',
    audienceDetail:
      'Un indépendant ou une petite équipe marketing qui veut un suivi quotidien sans budget d’agence.',
    strengths: [
      'C’est le tarif d’entrée le plus bas du marché pour un suivi quotidien : 15 questions relevées chaque jour sur quatre moteurs, avec historique, pour moins de 30 €. Le plan Lite inclut aussi un audit GEO du site (1 000 URL par mois) et trois recommandations par semaine.',
    ],
    weaknesses: [
      'Quinze questions au plan Lite, c’est peu — assez pour une activité locale, pas pour une marque multi-gammes. La couverture complète coûte vite cher : ajouter Claude au plan Lite revient à doubler la facture. L’API et l’accès MCP demandent le plan Standard à 189 €. Et les questions générées le sont en anglais par défaut : vous pouvez saisir les vôtres en français, mais il faut le faire.',
    ],
    features: [
      '4 moteurs suivis quotidiennement (Claude, Gemini et AI Mode en options payantes)',
      'Audit GEO du site : 1 000 URL par mois au plan Lite, jusqu’à 10 000 ensuite',
      '3 recommandations par semaine au plan Lite, illimitées à partir de Standard',
      'API et accès MCP à partir du plan Standard (189 €) — absents du plan Lite',
    ],
    itemListDescription:
      'Suivi quotidien de la visibilité IA à partir de 29 €/mois, 15 questions, quatre moteurs, Claude et Gemini en options payantes. Interface en anglais.',
    sources: [
      { label: 'otterly.ai/pricing', href: 'https://otterly.ai/pricing/' },
      {
        label: 'help.otterly.ai — plans et moteurs inclus',
        href: 'https://help.otterly.ai/pricing-of-otterlyai',
      },
    ],
  },
  {
    slug: 'peec',
    name: 'Peec AI',
    website: 'https://peec.ai',
    priceSummary: '85 €/mois',
    engineSummary: '3 au choix parmi ChatGPT, AI Mode, AI Overviews, Copilot, Gemini, Naver',
    language: 'Anglais',
    target: 'Équipes SEO, agences',
    priceDetail:
      'Starter à 85 €/mois, Pro à 205 €, Advanced à 425 € (70, 180 et 360 € en annuel). Enterprise sur devis, facturé à l’année. Essai gratuit de 7 jours.',
    engineDetail:
      'Trois modèles au choix parmi ChatGPT, Google AI Mode, Google AI Overviews, Microsoft Copilot, Gemini et Naver AI. Ni Claude ni Perplexity dans les offres en libre-service ; le contrat entreprise ouvre jusqu’à 13 modèles.',
    languageDetail: 'Interface en anglais, éditeur berlinois.',
    audienceDetail:
      'Les équipes SEO et les agences, avec une grille dédiée aux agences facturée en crédits.',
    strengths: [
      'La profondeur d’analyse pour le prix : 50 questions relevées chaque jour, utilisateurs illimités, analyse des sources citées, audit de crawlabilité des robots IA, suivi du trafic référent venu des assistants. C’est l’outil qui a fait baisser les prix du marché.',
    ],
    weaknesses: [
      'Le choix limité à trois modèles sur le plan d’entrée oblige à arbitrer, et deux moteurs importants manquent en libre-service. Pour une TPE sans équipe marketing, l’interface — dense, en anglais, pensée pour des SEO — demande un apprentissage.',
    ],
    itemListDescription:
      'Plateforme d’analyse de la visibilité IA à partir de 85 €/mois, 50 questions, trois moteurs au choix parmi six. Interface en anglais.',
    sources: [{ label: 'peec.ai/pricing', href: 'https://peec.ai/pricing' }],
  },
  {
    slug: 'profound',
    name: 'Profound',
    website: 'https://www.tryprofound.com',
    priceSummary: 'Pas de prix public (essai 7 jours)',
    engineSummary: 'Essai : ChatGPT, Gemini, AI Overviews · contrat : jusqu’à 9',
    language: 'Anglais',
    target: 'Grands comptes',
    priceDetail:
      'Il n’y en a plus de public. La page de tarifs ne propose qu’un essai gratuit de 7 jours, limité à 50 questions par jour, et un contrat entreprise sur démonstration. Les tarifs de 99 $ et 399 $/mois qui circulent dans les comparatifs correspondent à d’anciens plans en libre-service ; les contrats entreprise sont estimés par des sources tierces entre 2 000 et 5 000 $/mois, chiffres que nous ne pouvons pas vérifier.',
    engineDetail:
      'L’essai couvre ChatGPT, Gemini et Google AI Overviews. Le contrat ajoute Perplexity, AI Mode, Copilot, DeepSeek, Claude et Exa — jusqu’à neuf.',
    languageDetail: 'Interface en anglais.',
    audienceDetail:
      'Les grands comptes qui « opérationnalisent » la visibilité IA avec des agents et une équipe dédiée.',
    strengths: [
      'La couverture et la profondeur : suivi des robots IA sur les logs, analyse des conversations, agents, API, SSO, spécialiste dédié. C’est la référence citée par les autres éditeurs quand ils se comparent.',
    ],
    weaknesses: [
      'L’accès. Sans prix public, sans plan PME, avec une négociation commerciale obligatoire, ce n’est pas un outil qu’une TPE française peut essayer un mardi soir. Et l’essai n’ouvre que trois moteurs.',
    ],
    itemListDescription:
      'Plateforme de visibilité IA orientée grands comptes, jusqu’à neuf moteurs, sans prix public depuis 2026 : accès par démonstration commerciale.',
    sources: [{ label: 'tryprofound.com/pricing', href: 'https://www.tryprofound.com/pricing' }],
  },
  {
    slug: 'qwairy',
    name: 'Qwairy',
    website: 'https://qwairy.co',
    priceSummary: '79 € HT/mois (65 € en annuel)',
    engineSummary:
      'ChatGPT, Perplexity, Gemini, Claude, Copilot, AI Overviews, AI Mode, Grok, Mistral, DeepSeek (10)',
    language: 'Anglais (éditeur français)',
    target: 'PME, agences, équipes SEO',
    priceDetail:
      'Starter à 79 € HT/mois (65 € en annuel, facturé 790 €) pour 100 questions et un espace de travail, Growth à 199 € (165 € en annuel) pour 300 questions et cinq espaces, Business à 449 € (374 €) pour 800 questions et vingt espaces, Enterprise sur devis. Un plan gratuit de 120 crédits permet d’essayer sans carte bancaire.',
    engineDetail:
      'Dix, dès le premier plan : ChatGPT, Perplexity, Gemini, Claude, Copilot, Google AI Overviews, AI Mode, Grok, Mistral et DeepSeek. C’est la couverture la plus large du comparatif à prix public, et la seule à inclure Mistral.',
    languageDetail:
      'Éditeur français (« Made in France », données hébergées en Europe), mais site et interface en anglais au moment du relevé.',
    audienceDetail:
      'Les PME, les agences et les équipes SEO ou contenu, avec une grille agences séparée.',
    strengths: [
      'Le rapport couverture-prix, et l’intégration à votre outillage : connexion Google Search Console et Bing Webmaster Tools, accès MCP dès le premier plan (vous interrogez vos données depuis Claude ou un autre assistant), API REST à partir de Growth. Le suivi se règle en quotidien, hebdomadaire ou mensuel.',
    ],
    weaknesses: [
      'L’interface en anglais pour un produit qui se présente comme français, et une facturation en crédits qu’il faut comprendre avant d’acheter : 1 300 crédits par mois au premier plan, et un relevé quotidien sur dix moteurs les consomme vite. Le connecteur Looker Studio et l’analyse des robots IA sont réservés au plan Business à 449 €.',
    ],
    features: [
      '10 moteurs dès le premier plan, dont Mistral et DeepSeek',
      'Accès MCP dès le plan Starter, API REST à partir de Growth',
      'Connexion Google Search Console et Bing Webmaster Tools',
      'Connecteur Looker Studio et analyse des robots IA réservés au plan Business (449 €)',
    ],
    itemListDescription:
      'Outil français de suivi de la visibilité IA sur dix moteurs dont Claude et Mistral, à partir de 79 € HT/mois pour 100 questions, avec accès MCP et connexion Search Console. Interface en anglais.',
    sources: [{ label: 'qwairy.co/pricing', href: 'https://qwairy.co/pricing' }],
  },
  {
    slug: 'scrunch',
    name: 'Scrunch AI',
    website: 'https://scrunch.com',
    priceSummary: '300 $/mois (250 $ en annuel)',
    engineSummary: 'ChatGPT, Claude, Gemini, Perplexity, AI Mode, AI Overviews, Meta (7)',
    language: 'Anglais',
    target: 'Marques, agences',
    priceDetail:
      'Starter à 300 $/mois au mois ou 250 $/mois en annuel, Growth à 500 $/mois (417 $ en annuel), Enterprise sur devis. Sièges supplémentaires à 25 $. Essai de 7 jours sans carte.',
    engineDetail:
      'ChatGPT, Claude, Gemini, Perplexity, Google AI Mode, AI Overviews et Meta — sept, dès le premier plan.',
    languageDetail: 'Interface en anglais.',
    audienceDetail:
      'Les marques et les agences, avec des « personas » pour segmenter les questions par profil d’acheteur.',
    strengths: [
      'La couverture la plus large des offres à prix public, Claude et Perplexity compris, avec 350 questions personnalisées et 1 000 questions sectorielles au plan d’entrée. Aucun autre outil du tableau ne donne autant de moteurs sans négocier.',
    ],
    weaknesses: [
      'Le ticket d’entrée : 300 $/mois est dix fois le prix d’Otterly, pour une TPE qui n’a besoin que d’une vingtaine de questions. Et l’outil est conçu pour le marché nord-américain — vos questions en français, c’est vous qui les écrivez.',
    ],
    itemListDescription:
      'Suivi de visibilité IA sur sept moteurs dont Claude et Perplexity, à partir de 300 $/mois au mois ou 250 $/mois avec engagement annuel.',
    sources: [{ label: 'scrunch.com/pricing', href: 'https://scrunch.com/pricing/' }],
  },
  {
    slug: 'semrush',
    name: 'Semrush AI Visibility Toolkit',
    website: 'https://www.semrush.com/pricing/ai/',
    priceSummary: '94,94 €/mois par domaine, engagement annuel',
    engineSummary: 'ChatGPT, Google AI, Gemini, Perplexity (4)',
    language: 'Français disponible',
    target: 'PME et agences équipées Semrush',
    priceDetail:
      '94,94 €/mois par domaine, facturé à l’année. Essai de 7 jours. Le module est aussi vendu dans les bundles Semrush One (Starter à 199 $/mois). Des options de 9,59 à 86,31 €/mois s’ajoutent selon les besoins.',
    engineDetail:
      'ChatGPT, Google AI (AI Overviews et AI Mode), Gemini et Perplexity. Pas de Claude.',
    languageDetail: 'Interface disponible en français.',
    audienceDetail:
      'Les PME et agences qui utilisent déjà Semrush pour le SEO et veulent un onglet de plus, pas un outil de plus.',
    strengths: [
      'L’intégration avec l’écosystème Semrush et une interface traduite. Vous retrouvez vos mots-clés, vos concurrents et vos rapports au même endroit, et le module audite la lisibilité du site par les IA.',
    ],
    weaknesses: [
      '25 questions suivies et un seul domaine pour ce prix, c’est la dotation la plus mince du comparatif, et l’engagement annuel est obligatoire. Un deuxième site double la facture.',
    ],
    itemListDescription:
      'Module de visibilité IA de Semrush à 94,94 €/mois par domaine avec engagement annuel, 25 questions suivies, quatre moteurs. Interface disponible en français.',
    sources: [{ label: 'semrush.com/pricing/ai', href: 'https://www.semrush.com/pricing/ai/' }],
  },
  {
    slug: 'writesonic',
    name: 'Writesonic',
    website: 'https://writesonic.com',
    priceSummary: '79 $/mois, engagement annuel',
    engineSummary: 'ChatGPT, Gemini, AI Overviews (3) · 10 en contrat entreprise',
    language: 'Anglais',
    target: 'Équipes contenu',
    priceDetail:
      'Starter à 79 $/mois, Basic à 199 $, Growth à 399 $ — tous facturés à l’année (948 $, 2 388 $ et 4 788 $). Enterprise sur devis. Essai gratuit sans carte.',
    engineDetail:
      'ChatGPT, Gemini et Google AI Overviews sur les trois plans publics. Perplexity, Claude, Grok, DeepSeek, Copilot, Meta AI et AI Mode — dix moteurs au total — ne sont ouverts qu’en contrat entreprise.',
    languageDetail: 'Interface en anglais.',
    audienceDetail:
      'Les équipes contenu qui produisent déjà des articles et veulent mesurer leur effet dans les IA.',
    strengths: [
      'Rédaction et mesure dans le même outil : 15 articles par mois et 10 audits de site sont inclus dès le premier plan, avec 50 questions suivies quotidiennement. Pour une équipe qui achète déjà un rédacteur IA, le suivi vient en plus.',
    ],
    weaknesses: [
      'Trois moteurs seulement hors contrat entreprise : ni Perplexity ni Claude, alors que ce sont deux moteurs que vos clients B2B utilisent. Et l’engagement annuel est obligatoire : 79 $/mois signifie 948 $ d’un coup.',
    ],
    itemListDescription:
      'Plateforme qui associe rédaction de contenu et suivi de visibilité IA, à partir de 79 $/mois avec engagement annuel, trois moteurs hors contrat entreprise.',
    sources: [{ label: 'writesonic.com/pricing', href: 'https://writesonic.com/pricing' }],
  },
  {
    slug: 'yext',
    name: 'Yext Scout',
    website: 'https://www.yext.com/platform/scout',
    priceSummary: 'Sur devis, facturé par établissement',
    engineSummary: 'AI Overviews, ChatGPT, Gemini, Claude, Perplexity (5)',
    language: 'Anglais',
    target: 'Réseaux multi-établissements',
    priceDetail:
      'Sur devis, facturé par établissement, dans le cadre de la plateforme Yext. Aucun prix public.',
    engineDetail:
      'Google AI Overviews, ChatGPT, Gemini, Claude et Perplexity, plus la recherche Google classique et Google Maps.',
    languageDetail: 'Interface en anglais (plateforme multilingue).',
    audienceDetail:
      'Les réseaux multi-établissements — banques, concessions, cliniques, franchises.',
    strengths: [
      'C’est le seul outil du comparatif qui mesure la visibilité IA par point de vente et la relie aux données locales (fiches, avis, horaires) que Yext gère déjà pour ses clients. Pour un réseau de 200 agences, aucun autre ne fait ça.',
    ],
    weaknesses: [
      'Il ne s’achète pas seul. Sans la plateforme Yext, pas de Scout — et la plateforme Yext s’adresse à des réseaux, pas à un site unique.',
    ],
    itemListDescription:
      'Module de visibilité IA de la plateforme Yext, mesuré par point de vente sur cinq moteurs, vendu sur devis aux réseaux multi-établissements.',
    sources: [{ label: 'yext.com/platform/scout', href: 'https://www.yext.com/platform/scout' }],
  },
]

export function getGeoTool(slug: string): GeoTool | undefined {
  return GEO_TOOLS.find((t) => t.slug === slug)
}

/** L'entrée GeoMind — côté gauche de toutes les pages de comparaison. */
export const GEOMIND_TOOL = getGeoTool('geomind')!
