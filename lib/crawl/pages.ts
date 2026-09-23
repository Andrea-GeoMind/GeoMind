// Types et helpers purs pour les pages crawlées — sans dépendance I/O, donc
// importable dans les tests unitaires (le module DB ouvre une connexion au chargement).

import { extractJsonLd } from '@/lib/crawl/json-ld'
import { extractHeadings } from '@/lib/crawl/headings'
import { extractMetaRobots } from '@/lib/crawl/robots-directives'
import type { FirecrawlDocument } from '@/lib/crawl/schemas'

export type FirecrawlPageInsert = {
  siteId: string
  url: string
  markdown: string | null
  metadata: Record<string, unknown> | null
  statusCode: number | null
}

/**
 * Dédoublonne un lot de pages par (siteId, url) en gardant la dernière occurrence.
 *
 * Indispensable avant l'upsert batch : plusieurs URLs sources peuvent se
 * canonicaliser vers la même `metadata.url` (sites builder type eatbu/DISH où
 * `/`, le domaine nu et `?lang=xx` renvoient tous la même page). Postgres rejette
 * un `INSERT ... ON CONFLICT DO UPDATE` qui affecte deux fois la même ligne cible
 * dans une seule requête → tout l'insert échoue, 0 page écrite, découverte bloquée.
 */
export function dedupeFirecrawlPages(pages: FirecrawlPageInsert[]): FirecrawlPageInsert[] {
  return Array.from(new Map(pages.map((p) => [`${p.siteId}\n${p.url}`, p])).values())
}

/**
 * Construit les métadonnées persistées d'une page à partir du document Firecrawl.
 *
 * Firecrawl ne renvoie pas les entités Schema.org : on les extrait nous-mêmes du
 * HTML brut, sinon les 7 règles `schema_org_*` (qui lisent `metadata.schemaOrgs`)
 * se déclenchent sur tous les sites, même parfaitement balisés. Le HTML brut, lui,
 * n'est pas conservé — seules les entités extraites le sont.
 */
export function buildPageMetadata(doc: FirecrawlDocument): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    ...(doc.metadata ?? {}),
    schemaOrgs: extractJsonLd(doc.rawHtml),
    // Les directives d'indexation lues à la source. Le champ `robots` de
    // Firecrawl est conservé tel quel au-dessus, mais il s'est révélé faux sur
    // deux sites réels : la règle noindex exige désormais ce recoupement.
    robotsHtml: extractMetaRobots(doc.rawHtml),
  }
  // Les titres viennent du HTML : le markdown de Firecrawl perd ceux placés dans
  // un en-tête ou une bannière, d'où de faux « H1 manquant ».
  const headings = extractHeadings(doc.rawHtml)
  if (headings) {
    metadata.h1 = headings.h1
    metadata.h2 = headings.h2
    metadata.headingLevels = headings.levels
  }
  return metadata
}
