import FirecrawlApp from '@mendable/firecrawl-js'
import { firecrawlDocumentSchema } from '@/lib/crawl/schemas'
import { buildPageMetadata } from '@/lib/crawl/pages'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

/**
 * Crawl d'un prospect, en mémoire et sans base.
 *
 * `lib/crawl/firecrawl.ts#crawlSite` exige un siteId et écrit les pages en
 * base : inutilisable ici, la prospection ne doit rien créer en production.
 * On réutilise en revanche le même schéma et `buildPageMetadata`, pour que les
 * règles voient exactement la forme de page qu'elles voient en production.
 *
 * Coût : 1 crédit Firecrawl par page scrapée.
 */

/** Profondeur retenue pour la prospection — le réglage du plan Solo. */
export const PROSPECT_MAX_PAGES = 5

const CRAWL_TIMEOUT_MS = 90_000

export async function crawlProspect(
  app: FirecrawlApp,
  siteUrl: string,
  maxPages = PROSPECT_MAX_PAGES
): Promise<FirecrawlPage[]> {
  const job = await Promise.race([
    app.crawl(siteUrl, {
      limit: maxPages,
      scrapeOptions: { formats: ['markdown', 'rawHtml'], maxAge: 0 },
    }),
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('crawl : délai dépassé')), CRAWL_TIMEOUT_MS)
    ),
  ])

  if (job.status !== 'completed') {
    throw new Error(`crawl incomplet (status=${job.status})`)
  }

  const pages: FirecrawlPage[] = []
  for (const raw of job.data) {
    const parsed = firecrawlDocumentSchema.safeParse(raw)
    if (!parsed.success) continue
    const doc = parsed.data
    pages.push({
      url: doc.metadata?.url ?? siteUrl,
      markdown: doc.markdown ?? '',
      statusCode: doc.metadata?.statusCode ?? 200,
      metadata: buildPageMetadata(doc) as unknown as FirecrawlPage['metadata'],
    })
  }
  return pages
}
