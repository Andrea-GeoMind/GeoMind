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
