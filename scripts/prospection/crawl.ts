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

/**
 * Espacement minimum entre deux crawls.
 *
 * Le plan Firecrawl autorise 3 requêtes par minute. La première série a perdu
 * 6 sites sur 30 en « Rate limit exceeded » faute de temporisation. 21 s
 * laissent une marge sur les 20 s théoriques.
 */
const MIN_INTERVAL_MS = 21_000

let lastCrawlAt = 0

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Délai demandé par Firecrawl dans son message, en ms (défaut 15 s). */
export function retryAfterMs(message: string): number {
  const m = message.match(/retry after (\d+)\s*s/i)
  return m ? (Number(m[1]) + 2) * 1000 : 15_000
}

function isRateLimit(err: unknown): boolean {
  return err instanceof Error && /rate limit/i.test(err.message)
}

export async function crawlProspect(
  app: FirecrawlApp,
  siteUrl: string,
  maxPages = PROSPECT_MAX_PAGES,
  maxAttempts = 3
): Promise<FirecrawlPage[]> {
  // Respecte le débit du plan, sans quoi une série longue perd des sites.
  const since = Date.now() - lastCrawlAt
  if (since < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - since)

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      lastCrawlAt = Date.now()
      return await runCrawl(app, siteUrl, maxPages)
    } catch (err) {
      lastErr = err
      // Seule la limite de débit vaut une reprise : elle est transitoire et
      // Firecrawl indique lui-même combien de temps attendre.
      if (!isRateLimit(err) || attempt === maxAttempts) throw err
      await sleep(retryAfterMs((err as Error).message))
    }
  }
  throw lastErr
}

async function runCrawl(
  app: FirecrawlApp,
  siteUrl: string,
  maxPages: number
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
