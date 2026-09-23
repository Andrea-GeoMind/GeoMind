import type { MetadataRoute } from 'next'
import { ARTICLES } from '@/lib/marketing/articles'
import { SECTEURS } from '@/lib/marketing/secteurs'
import { COMPARISONS } from '@/lib/marketing/comparisons'

/** Sitemap des pages publiques — règle GEO élémentaire (cf. règles produit). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://geomind.fr'
  const lastModified = new Date()

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/glossaire`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...SECTEURS.map((s) => ({
      url: `${base}/secteurs/${s.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    {
      url: `${base}/outils/generateur-llms-txt`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Page d'acquisition stratégique (cible « comment savoir si ChatGPT
    // parle de mon site ») : priorité au-dessus des articles, en dessous
    // de /pricing.
    {
      url: `${base}/verifier-visibilite-chatgpt`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Pages de comparaison « GeoMind vs X » — entre les articles (0.7) et la
    // page outil (0.8) : elles captent une intention d'achat précise.
    ...COMPARISONS.map((c) => ({
      url: `${base}/comparatif/geomind-vs-${c.toolSlug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...ARTICLES.map((a) => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.datePublished),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${base}/legal/cgv`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/mentions`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
