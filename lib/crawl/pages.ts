// Types et helpers purs pour les pages crawlées — sans dépendance I/O, donc
// importable dans les tests unitaires (le module DB ouvre une connexion au chargement).

import { extractJsonLd } from '@/lib/crawl/json-ld'
import { extractHeadings } from '@/lib/crawl/headings'
import { extractMetaRobots } from '@/lib/crawl/robots-directives'
import { extractDocumentMeta, stripEmbeddedDocuments } from '@/lib/crawl/document-scope'
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
    // Directives lues dans le head du rawHtml de Firecrawl. Conservé pour le
    // diagnostic, mais AUCUNE règle ne doit s'y fier : ce HTML vient de la même
    // requête que `metadata.robots`, donc l'un ne recoupe pas l'autre. La
    // source qui fait foi est `metadata.robotsSelf`, posée par `probePages`.
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

  // Les balises uniques au document, relues sur le document nettoyé. Le parseur
  // de Firecrawl travaille sur le HTML aplati : il peut rapporter le <title>,
  // le canonical ou le lang d'une iframe tierce.
  //
  // On ne remplace jamais une valeur de Firecrawl par du vide sur la seule foi
  // de notre extraction : si elle échouait, on effacerait une valeur correcte
  // et on fabriquerait un « title manquant » — le défaut même qu'on corrige.
  // Une valeur n'est écartée que si elle est ABSENTE du document nettoyé tout
  // en étant PRÉSENTE dans le brut : la preuve qu'elle vient d'un sous-document.
  const own = extractDocumentMeta(doc.rawHtml)
  if (own && doc.rawHtml) {
    const clean = stripEmbeddedDocuments(doc.rawHtml)
    const applique = (cles: string[], mien: string | null) => {
      for (const cle of cles) {
        const firecrawl = metadata[cle]
        if (mien !== null) {
          metadata[cle] = mien
        } else if (typeof firecrawl === 'string' && firecrawl.trim() !== '') {
          const venaitDuSousDocument =
            !clean.includes(firecrawl) && doc.rawHtml!.includes(firecrawl)
          if (venaitDuSousDocument) delete metadata[cle]
        }
      }
    }
    applique(['title'], own.title)
    applique(['description'], own.description)
    applique(['canonical'], own.canonical)
    applique(['language'], own.language)
    applique(['ogTitle', 'og:title'], own.ogTitle)
    applique(['ogDescription', 'og:description'], own.ogDescription)
    applique(['ogImage', 'og:image'], own.ogImage)
    applique(['twitterCard', 'twitter:card'], own.twitterCard)
    applique(['viewport'], own.viewport)
  }

  return metadata
}
