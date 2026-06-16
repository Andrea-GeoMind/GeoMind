/**
 * lib/marketing/articles.ts
 *
 * Registre des articles du blog (PLAN item 22). Source unique pour l'index
 * /blog, le sitemap et les liens internes. Le contenu vit dans
 * app/(marketing)/blog/<slug>/page.tsx.
 */

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  /** ISO — affichée et exposée en datePublished (Schema.org Article) */
  datePublished: string
  readingMinutes: number
}

export const ARTICLES: ArticleMeta[] = [
  {
    slug: 'choisir-outil-visibilite-ia',
    title: 'Comment choisir un outil de visibilité IA (GEO) en 2026',
    description:
      'Suivi des citations, audit technique, recommandations, prix : les critères pour choisir un outil de visibilité dans les IA, et les questions à poser avant de vous engager.',
    datePublished: '2026-06-16',
    readingMinutes: 8,
  },
  {
    slug: 'entreprise-pas-citee-chatgpt',
    title: 'Mon entreprise n’apparaît pas dans ChatGPT : que faire ?',
    description:
      'Vous avez demandé à ChatGPT et c’est un concurrent qui sort ? Voici les 6 causes les plus fréquentes et comment y remédier, étape par étape.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'apparaitre-dans-gemini',
    title: 'Comment apparaître dans Google Gemini',
    description:
      'Gemini s’appuie sur l’index de Google et ses signaux d’autorité. Voici comment fonctionne son choix de sources et comment devenir l’une d’elles.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'suivre-citations-ia',
    title: 'Comment suivre ses citations dans les IA (et pourquoi c’est crucial)',
    description:
      'Être cité par les IA, ça se mesure. Pourquoi suivre une tendance plutôt qu’un score, quoi surveiller, et comment mettre en place un suivi fiable.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'quest-ce-que-le-geo',
    title: 'Qu’est-ce que le GEO (Generative Engine Optimization) ?',
    description:
      'Définition simple du GEO, pourquoi il devient incontournable face à ChatGPT et Perplexity, et en quoi il diffère du SEO classique — expliqué pour les dirigeants de TPE et PME.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'etre-visible-perplexity',
    title: 'Comment apparaître dans les réponses de Perplexity',
    description:
      'Perplexity cite ses sources, ligne par ligne. Voici comment fonctionne son moteur et les actions concrètes pour que votre site fasse partie des sources citées.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'savoir-si-chatgpt-parle-de-mon-entreprise',
    title: 'Comment savoir si ChatGPT parle de votre entreprise',
    description:
      'La méthode pas à pas pour tester, à la main ou avec un outil, si les IA citent votre entreprise — et quoi faire quand ce sont vos concurrents qui apparaissent à votre place.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'geo-commerce-local',
    title: 'GEO local : être recommandé par les IA près de chez vous',
    description:
      'Restaurants, artisans, commerces, professions libérales : comment devenir la réponse des IA quand un client cherche un professionnel dans votre ville.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'apparaitre-google-ai-overviews',
    title: 'Comment apparaître dans les AI Overviews de Google',
    description:
      'Google répond désormais directement en haut de ses résultats avec l’IA. Voici comment fonctionnent les AI Overviews et comment devenir une de leurs sources.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'geo-ecommerce',
    title: 'GEO pour le e-commerce : faire recommander vos produits par les IA',
    description:
      'Quand un client demande à une IA « quel est le meilleur produit pour… », comment faire en sorte que ce soit le vôtre qui soit cité ? Le guide GEO pour les boutiques en ligne.',
    datePublished: '2026-06-16',
    readingMinutes: 7,
  },
  {
    slug: 'erreurs-geo-frequentes',
    title: 'Les 7 erreurs GEO qui vous rendent invisible dans les IA',
    description:
      'Robots.txt qui bloque, contenu vague, infos incohérentes… les erreurs les plus courantes qui empêchent les IA de citer votre entreprise — et comment les corriger.',
    datePublished: '2026-06-16',
    readingMinutes: 6,
  },
  {
    slug: 'comment-etre-cite-par-chatgpt',
    title: 'Comment être cité par ChatGPT : le guide pour TPE et PME',
    description:
      'Les 5 actions concrètes pour qu\'une IA cite votre entreprise quand un client pose une question de votre domaine — sans budget, sans jargon.',
    datePublished: '2026-06-12',
    readingMinutes: 6,
  },
  {
    slug: 'geo-vs-seo',
    title: 'GEO vs SEO : ce qui change, ce qui reste',
    description:
      'Faut-il abandonner le référencement Google pour optimiser sa visibilité dans les IA ? Non — voici comment les deux s\'articulent, et par quoi commencer.',
    datePublished: '2026-06-12',
    readingMinutes: 5,
  },
  {
    slug: 'fichiers-qui-parlent-aux-ia',
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
