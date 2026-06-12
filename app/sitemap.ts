import type { MetadataRoute } from 'next'

/** Sitemap des pages publiques — règle GEO élémentaire (cf. règles produit). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://geomind.fr'
  const lastModified = new Date()

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/legal/cgv`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/mentions`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
