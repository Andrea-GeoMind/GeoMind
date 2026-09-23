/**
 * lib/marketing/comparisons.ts
 *
 * Registre des pages de comparaison (/comparatif/geomind-vs-<slug>). Source
 * unique pour la route dynamique, les métadonnées, le sitemap et les liens
 * « Comparer en détail » posés dans l'article comparatif.
 *
 * Les FAITS (prix, moteurs, langue, cible, forces, limites, sources) ne sont
 * PAS ici : ils vivent dans lib/marketing/geo-tools.ts et sont partagés avec
 * l'article. Ce fichier ne porte que ce qui est propre à une comparaison :
 * la question posée en H1, la réponse courte, et le verdict par profil.
 *
 * Règle éditoriale : la réponse courte doit dire honnêtement quand l'autre
 * outil est le bon choix. Une page où GeoMind gagne sur tous les points ne
 * sera jamais citée — et ne mérite pas de l'être.
 */

export interface ComparisonFaq {
  q: string
  a: string
}

export interface ComparisonConfig {
  /** Slug de l'outil comparé — doit exister dans GEO_TOOLS. */
  toolSlug: string
  h1: string
  metaTitle: string
  metaDescription: string
  /** Trois lignes sous le H1 : qui devrait prendre quoi. */
  shortAnswer: string[]
  /** Synthèse de la section « Pour qui, chacun ». */
  verdictGeoMind: string
  verdictOther: string
  faq: ComparisonFaq[]
}

export const COMPARISONS: ComparisonConfig[] = [
  {
    toolSlug: 'otterly',
    h1: 'GeoMind ou Otterly.ai : lequel choisir ?',
    metaTitle: 'GeoMind ou Otterly.ai : lequel choisir ?',
    metaDescription:
      'GeoMind (plan gratuit, français, 4 IA dont Claude) et Otterly.ai (29 €/mois, anglais, suivi quotidien) comparés point par point : prix, moteurs, langue, fonctions et limites des deux.',
    shortAnswer: [
      'Otterly.ai est fait pour qui veut un suivi quotidien en anglais dès 29 €/mois, avec Claude, Gemini et AI Mode en options payantes.',
      'GeoMind est fait pour une TPE ou une PME française qui veut une interface, des questions et des recommandations en français, avec Claude inclus — mais seul son plan gratuit est ouvert aujourd’hui.',
      'Si vous avez besoin d’un relevé quotidien sur des dizaines de questions, Otterly va plus loin que nous, et il est achetable tout de suite ; si vous voulez comprendre et corriger en français, commencez par notre plan gratuit.',
    ],
    verdictGeoMind:
      'Prenez GeoMind si vous êtes une TPE ou une PME française, que vous voulez comprendre pourquoi vous n’êtes pas cité et quoi corriger — pas seulement un chiffre — et qu’un audit par mois vous suffit. Le plan gratuit couvre un site et va jusqu’au bout d’une analyse complète, sans carte bancaire.',
    verdictOther:
      'Prenez Otterly.ai si vous êtes à l’aise en anglais, que vous voulez un relevé quotidien plutôt qu’hebdomadaire, que vous avez besoin d’une API ou d’un accès MCP, ou simplement d’un abonnement payant disponible immédiatement — ce que nos plans payants ne sont pas encore.',
    faq: [
      {
        q: 'GeoMind est-il vraiment gratuit, contrairement à Otterly.ai ?',
        a: 'GeoMind a un plan gratuit permanent : un site, environ deux analyses complètes, sans carte bancaire. Otterly.ai n’a qu’un essai gratuit limité dans le temps, puis un plan Lite à 29 €/mois. À l’inverse, les plans payants de GeoMind ne sont pas encore ouverts à la vente, alors que ceux d’Otterly le sont.',
      },
      {
        q: 'Otterly.ai fonctionne-t-il en français ?',
        a: 'Son interface est en anglais et il génère ses questions de suivi en anglais par défaut. Vous pouvez y saisir vos propres questions en français, mais rien n’est traduit ni généré nativement pour le marché français, contrairement à GeoMind.',
      },
      {
        q: 'Otterly.ai suit-il Claude ?',
        a: 'Oui, mais en option payante : 29 €/mois sur le plan Lite, 109 € sur Standard, 439 € sur Premium. GeoMind interroge Claude sur tous ses plans, plan gratuit compris.',
      },
      {
        q: 'Puis-je utiliser les deux en même temps ?',
        a: 'Rien ne l’empêche : Otterly pour un relevé quotidien à large volume, GeoMind pour l’audit, les recommandations et le coach en français.',
      },
      {
        q: 'Lequel choisir pour une PME française qui débute ?',
        a: 'GeoMind, pour le plan gratuit en français et les recommandations concrètes, si votre besoin tient dans une dizaine de questions et un audit par mois. Passez à Otterly.ai si vous avez besoin d’un relevé quotidien sur un grand volume de questions, ou d’un abonnement payant disponible dès maintenant.',
      },
    ],
  },
  {
    toolSlug: 'qwairy',
    h1: 'GeoMind ou Qwairy : lequel choisir ?',
    metaTitle: 'GeoMind ou Qwairy : lequel choisir ?',
    metaDescription:
      'Deux outils GEO français comparés : Qwairy (79 € HT/mois, 10 moteurs, interface en anglais) et GeoMind (plan gratuit, 4 moteurs, tout en français). Prix, moteurs, fonctions et limites des deux.',
    shortAnswer: [
      'Qwairy est fait pour une PME ou une agence qui veut la couverture la plus large du marché à prix public — dix moteurs dès 79 € HT/mois, avec API et accès MCP.',
      'GeoMind est fait pour une TPE ou une PME française qui veut comprendre et corriger en français, sans équipe marketing ; seul son plan gratuit est ouvert aujourd’hui.',
      'Les deux sont édités en France et hébergent en Europe. Qwairy couvre six moteurs de plus que nous et s’achète tout de suite ; nous sommes en français de bout en bout, interface comprise.',
    ],
    verdictGeoMind:
      'Prenez GeoMind si personne chez vous ne veut lire une interface SEO en anglais, si vous voulez un plan d’action expliqué plutôt qu’un tableau de bord, et si un audit par mois sur une dizaine de questions couvre votre activité.',
    verdictOther:
      'Prenez Qwairy si vous suivez des centaines de questions, si Google AI Overviews, AI Mode, Mistral ou Grok comptent pour vos clients, si vous voulez brancher vos données à Search Console, à une API ou à un assistant via MCP — ou simplement si vous avez besoin d’un abonnement payant disponible immédiatement.',
    faq: [
      {
        q: 'Qwairy et GeoMind sont-ils tous les deux français ?',
        a: 'Oui : Qwairy affiche « Made in France » et héberge ses données en Europe, GeoMind est édité depuis le Vaucluse et héberge aussi en Europe. La différence est la langue du produit : au moment du relevé, le site et l’interface de Qwairy sont en anglais, tandis que GeoMind est en français, interface, questions générées et recommandations comprises.',
      },
      {
        q: 'Combien de moteurs couvre chacun ?',
        a: 'Qwairy en couvre dix dès son premier plan : ChatGPT, Perplexity, Gemini, Claude, Copilot, Google AI Overviews, AI Mode, Grok, Mistral et DeepSeek. GeoMind en couvre quatre sur tous ses plans : ChatGPT, Claude, Gemini et Perplexity — sans Google AI Overviews ni AI Mode.',
      },
      {
        q: 'Lequel est le moins cher ?',
        a: 'GeoMind a un plan gratuit permanent et Qwairy un plan gratuit de 120 crédits pour essayer. Sur les offres payantes, Qwairy démarre à 79 € HT/mois pour 100 questions ; les plans payants de GeoMind sont annoncés à partir de 19 €/mois mais ne sont pas encore ouverts à la vente.',
      },
      {
        q: 'Qwairy propose-t-il une API et un accès MCP ?',
        a: 'Oui : l’accès MCP est inclus dès le plan Starter et l’API REST à partir de Growth. GeoMind n’a ni API ni connecteur Looker Studio.',
      },
      {
        q: 'Lequel choisir pour une agence ?',
        a: 'Qwairy, dans la plupart des cas : il a une grille dédiée aux agences, des espaces de travail par client et une API. GeoMind ne devient pertinent pour une agence que si ses clients sont des TPE françaises à qui il faut livrer un plan d’action lisible plutôt qu’un tableau de bord.',
      },
    ],
  },
  {
    toolSlug: 'meteoria',
    h1: 'GeoMind ou Meteoria : lequel choisir ?',
    metaTitle: 'GeoMind ou Meteoria : lequel choisir ?',
    metaDescription:
      'Deux outils GEO français en français : Meteoria (75 €/mois, relevé quotidien, 3 moteurs au choix) et GeoMind (plan gratuit, 4 moteurs, audit et recommandations). Prix, moteurs, fonctions et limites.',
    shortAnswer: [
      'Meteoria est fait pour une PME, une agence ou un grand compte qui veut un relevé quotidien rigoureux en français, avec 15 à 30 passes par question pour lisser la variabilité des réponses.',
      'GeoMind est fait pour une TPE ou une PME française qui veut d’abord savoir quoi corriger sur son site ; seul son plan gratuit est ouvert aujourd’hui.',
      'Les deux sont français, interface et support compris. Meteoria mesure plus souvent et plus finement ; nous couvrons quatre moteurs sans arbitrage et nous donnons le plan de correction.',
    ],
    verdictGeoMind:
      'Prenez GeoMind si votre question est « pourquoi les IA ne me citent pas, et par quoi je commence ? » plutôt que « comment ma courbe bouge-t-elle chaque jour ? », et si vous voulez tester sans carte bancaire avant de payer quoi que ce soit.',
    verdictOther:
      'Prenez Meteoria si la fiabilité de la mesure prime : relevé quotidien, 15 à 30 passes par question, sources citées, corrélation au trafic via Google Analytics, Matomo ou Looker Studio, sièges et marques illimités — et un abonnement payant disponible tout de suite.',
    faq: [
      {
        q: 'Meteoria et GeoMind sont-ils tous les deux en français ?',
        a: 'Oui, tous les deux : plateforme, support et documentation en français, éditeurs français, hébergement en Europe. C’est le seul face-à-face de ce comparatif où la langue n’est pas un critère de départage.',
      },
      {
        q: 'Combien de moteurs suit chacun ?',
        a: 'Meteoria annonce huit moteurs mais vous en choisissez trois par plan. GeoMind en interroge quatre — ChatGPT, Claude, Gemini, Perplexity — sur tous ses plans, sans arbitrage, mais sans Google AI Overviews ni AI Mode que Meteoria propose.',
      },
      {
        q: 'À quelle fréquence mesurent-ils ?',
        a: 'Meteoria relève chaque jour, avec 15 à 30 passes par question pour lisser la variabilité des réponses des IA. GeoMind fait un relevé hebdomadaire sur un échantillon de trois questions pour les plans payants et mensuel sur le plan gratuit, les analyses complètes étant lancées à la demande.',
      },
      {
        q: 'Lequel est le moins cher ?',
        a: 'GeoMind a un plan gratuit permanent, Meteoria un essai gratuit d’une semaine. Sur les offres payantes, Meteoria démarre à 75 €/mois pour 25 questions quotidiennes ; les plans payants de GeoMind sont annoncés à partir de 19 €/mois mais ne sont pas encore ouverts à la vente.',
      },
      {
        q: 'Peut-on utiliser les deux ?',
        a: 'Rien ne l’empêche : Meteoria pour le suivi quotidien de la position, GeoMind pour l’audit technique et éditorial du site et le plan de correction. Ce sont deux questions différentes — où j’en suis, et quoi corriger.',
      },
    ],
  },
  {
    toolSlug: 'ia-rank',
    h1: 'GeoMind ou ia-rank.com : lequel choisir ?',
    metaTitle: 'GeoMind ou ia-rank.com : lequel choisir ?',
    metaDescription:
      'ia-rank.com (99 €/mois, rapports mensuels, quatre moteurs annoncés) et GeoMind (plan gratuit, audit en ligne, quatre moteurs) comparés : prix, moteurs, fonctions, limites et ce que chacun documente publiquement.',
    shortAnswer: [
      'ia-rank.com est fait pour un commerce local qui préfère déléguer : un audit initial, un rapport mensuel et un support par e-mail, pour 99 €/mois sans engagement.',
      'GeoMind est fait pour qui veut voir les résultats lui-même, dans une interface, avec le détail de ce qui a été mesuré ; seul son plan gratuit est ouvert aujourd’hui.',
      'La vraie différence n’est pas le prix, c’est la transparence : au moment du relevé, ia-rank.com ne publie ni capture d’interface, ni méthodologie, ni exemple de rapport.',
    ],
    verdictGeoMind:
      'Prenez GeoMind si vous voulez voir les questions posées, les réponses des IA et le détail des vérifications, et tester sans rien payer avant de décider.',
    verdictOther:
      'Prenez ia-rank.com si vous ne voulez pas ouvrir un outil du tout et préférez recevoir un rapport écrit chaque mois, avec quelqu’un à qui écrire — et profitez de la semaine d’essai à 9 € pour vérifier ce que contient réellement le rapport avant de vous engager.',
    faq: [
      {
        q: 'Que mesure exactement ia-rank.com ?',
        a: 'Le site annonce un suivi sur ChatGPT, Gemini, Claude et Perplexity, un audit initial et un rapport mensuel. Au moment du relevé, il ne publie ni méthodologie, ni nombre de questions posées, ni exemple de rapport : ces éléments ne peuvent donc pas être vérifiés avant l’achat.',
      },
      {
        q: 'Lequel est le moins cher ?',
        a: 'GeoMind, pour commencer : son plan gratuit couvre un site et deux analyses complètes sans carte bancaire. ia-rank.com propose une première semaine à 9 €, puis 99 €/mois. Les plans payants de GeoMind sont annoncés à partir de 19 €/mois mais ne sont pas encore ouverts à la vente.',
      },
      {
        q: 'ia-rank.com est-il un outil ou une prestation ?',
        a: 'C’est à mi-chemin : l’offre comprend un audit, des rapports et un support par e-mail, mais aucune interface produit n’est montrée publiquement. GeoMind est un outil en libre-service : vous lancez vos analyses et lisez les résultats vous-même.',
      },
      {
        q: 'Les deux couvrent-ils les mêmes moteurs ?',
        a: 'Les quatre moteurs annoncés par ia-rank.com — ChatGPT, Gemini, Claude, Perplexity — sont ceux que GeoMind interroge. Aucun des deux ne couvre Google AI Overviews ni AI Mode.',
      },
      {
        q: 'Que vérifier avant de choisir ?',
        a: 'Demandez un exemple de rapport et la liste des questions posées. Un outil de visibilité IA qui ne dit pas comment il mesure vous laisse sans moyen de vérifier ce que vous achetez — c’est vrai pour n’importe quel éditeur, nous compris.',
      },
    ],
  },
]

export function getComparison(toolSlug: string): ComparisonConfig | undefined {
  return COMPARISONS.find((c) => c.toolSlug === toolSlug)
}
