import FirecrawlApp from '@mendable/firecrawl-js'
import { env } from '@/lib/env'
import { getSiteById } from '@/lib/db/queries/sites'
import { upsertFirecrawlPages, type FirecrawlPageInsert } from '@/lib/db/queries/firecrawl-pages'
import { withRetry } from '@/lib/crawl/retry'
import { firecrawlDocumentSchema } from '@/lib/crawl/schemas'

export { withRetry } from '@/lib/crawl/retry'
export { firecrawlDocumentSchema, firecrawlDocumentMetadataSchema, type FirecrawlDocument } from '@/lib/crawl/schemas'

// ─── Client Firecrawl (lazy) ───────────────────────────────────────────────────

let _client: FirecrawlApp | null = null

function getClient(): FirecrawlApp {
  if (!_client) _client = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY })
  return _client
}

// ─── crawlSite ─────────────────────────────────────────────────────────────────

export async function crawlSite({
  siteId,
  maxPages,
}: {
  siteId: string
  maxPages: number
}): Promise<{ siteId: string; pagesCount: number }> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`crawlSite: site introuvable (id=${siteId})`)

  const crawlJob = await withRetry(() =>
    getClient().crawl(site.url, {
      limit: maxPages,
      scrapeOptions: { formats: ['markdown'] },
    })
  )

  if (crawlJob.status !== 'completed') {
    throw new Error(`crawlSite: Firecrawl a échoué pour ${site.url} (status=${crawlJob.status})`)
  }

  const pages: FirecrawlPageInsert[] = []

  for (const raw of crawlJob.data) {
    const parsed = firecrawlDocumentSchema.safeParse(raw)
    if (!parsed.success) continue

    const doc = parsed.data
    const url = doc.metadata?.url ?? site.url

    pages.push({
      siteId,
      url,
      markdown: doc.markdown ?? null,
      metadata: doc.metadata ? (doc.metadata as Record<string, unknown>) : null,
      statusCode: doc.metadata?.statusCode ?? null,
    })
  }

  await upsertFirecrawlPages(pages)

  return { siteId, pagesCount: pages.length }
}
