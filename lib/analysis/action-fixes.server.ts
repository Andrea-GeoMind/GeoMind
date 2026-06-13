/**
 * lib/analysis/action-fixes.server.ts
 *
 * Helper serveur : construit la table `ruleKey → correctif` pour un site en
 * lisant ses métadonnées et ses pages crawlées (détection du CMS). Séparé de
 * `action-fixes.ts` (pur) pour qu'aucun composant client ne tire les requêtes DB.
 *
 * Utilisé par le Plan d'action et les fiches de recommandation (Technique /
 * Contenu) pour afficher le code prêt à coller au bon endroit.
 */

import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { detectCms, seedFaqEntries, type StudioSite, type CmsKind } from '@/lib/analysis/studio'
import { buildActionFixesByRule, type ActionFix } from '@/lib/analysis/action-fixes'

interface SiteLike {
  id: string
  name: string
  url: string
  language: string
  country: string
}

export async function getActionFixesByRule(site: SiteLike): Promise<Record<string, ActionFix>> {
  const [metadata, pages] = await Promise.all([
    getSiteMetadataBySiteId(site.id),
    getFirecrawlPagesBySiteId(site.id),
  ])

  const homeMeta = pages[0]?.metadata as Record<string, unknown> | null
  const generator = typeof homeMeta?.generator === 'string' ? homeMeta.generator : null
  const cms: CmsKind = detectCms(generator)

  const studioSite: StudioSite = {
    name: site.name,
    url: site.url,
    language: site.language,
    country: site.country,
    description: metadata?.description ?? null,
    keywords: metadata?.keywords ?? [],
  }

  return buildActionFixesByRule(studioSite, seedFaqEntries(studioSite), cms)
}
