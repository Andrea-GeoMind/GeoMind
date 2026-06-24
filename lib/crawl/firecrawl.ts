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

// ─── Bornes anti-blocage ────────────────────────────────────────────────────────
// Sans timeout, une seule page lente à scraper fait attendre tout le
// Promise.allSettled (qui attend la plus lente) → découverte bloquée à 90 %.
const MAP_TIMEOUT_MS = 15_000
const SCRAPE_TIMEOUT_MS = 20_000

/**
 * Borne une promesse : rejette après `ms` si elle n'a pas résolu. Ne coupe pas la
 * requête sous-jacente (Firecrawl finira par se résoudre, ignorée), mais arrête de
 * l'attendre — suffisant pour garantir le temps de mur de la découverte.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: timeout après ${ms / 1000} s`)), ms)
    ),
  ])
}

// ─── scrapeForDiscovery ────────────────────────────────────────────────────────
// Utilisé pour la découverte initiale (site.crawl.requested).
// Stratégie : map() pour lister les URLs (< 2s), puis scrape() en parallèle sur
// chaque URL trouvée (requêtes HTTP directes, sans job asynchrone ni polling).
// Un site à 2 pages : ~5-8s. Un site à 20 pages : ~10-15s (limité à maxPages).

export async function scrapeForDiscovery({
  siteId,
  maxPages = 5,
}: {
  siteId: string
  maxPages?: number
}): Promise<{ siteId: string; pagesCount: number }> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`scrapeForDiscovery: site introuvable (id=${siteId})`)

  const client = getClient()

  // 1. Lister les URLs présentes sur le site (rapide — pas de contenu scrappé)
  let urlsToScrape: string[] = [site.url]
  try {
    const mapResult = await withTimeout(
      client.map(site.url, { limit: maxPages + 5 }),
      MAP_TIMEOUT_MS,
      'map'
    )
    if (mapResult.links && mapResult.links.length > 0) {
      const discovered = mapResult.links
        .map((l) => l.url)
        .filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
        .slice(0, maxPages)
      // Toujours inclure la homepage
      if (!discovered.includes(site.url)) discovered.unshift(site.url)
      urlsToScrape = discovered.slice(0, maxPages)
    }
  } catch {
    // map() indisponible → on se rabat sur la homepage uniquement
  }

  // 2. Scraper chaque URL en parallèle (requête HTTP directe, pas de polling)
  const pages: FirecrawlPageInsert[] = []
  await Promise.allSettled(
    urlsToScrape.map(async (url) => {
      try {
        const doc = await withTimeout(
          client.scrape(url, { formats: ['markdown'] }),
          SCRAPE_TIMEOUT_MS,
          `scrape ${url}`
        )
        if (!doc) return
        const parsed = firecrawlDocumentSchema.safeParse(doc)
        if (!parsed.success) return
        pages.push({
          siteId,
          url: parsed.data.metadata?.url ?? url,
          markdown: parsed.data.markdown ?? null,
          metadata: parsed.data.metadata ? (parsed.data.metadata as Record<string, unknown>) : null,
          statusCode: parsed.data.metadata?.statusCode ?? null,
        })
      } catch {
        // Page inaccessible — on continue avec les autres
      }
    })
  )

  if (pages.length === 0) {
    throw new Error(`scrapeForDiscovery: aucune page accessible pour ${site.url}`)
  }

  await upsertFirecrawlPages(pages)
  return { siteId, pagesCount: pages.length }
}

// ─── crawlSite ─────────────────────────────────────────────────────────────────
// Utilisé pour les ré-analyses complètes (run-full-analysis quand pages > 2h).
// Crawl async Firecrawl : explore tous les liens, scrape jusqu'à maxPages pages.

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
