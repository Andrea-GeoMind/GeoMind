import FirecrawlApp from '@mendable/firecrawl-js'
import { env } from '@/lib/env'
import { getSiteById } from '@/lib/db/queries/sites'
import { upsertFirecrawlPages, type FirecrawlPageInsert } from '@/lib/db/queries/firecrawl-pages'
import { buildPageMetadata } from '@/lib/crawl/pages'
import { withRetry } from '@/lib/crawl/retry'
import { firecrawlDocumentSchema } from '@/lib/crawl/schemas'
import { measureResponseTimes } from '@/lib/crawl/response-time'
import { isCrawlTruncated, CRAWL_TRUNCATED_KEY } from '@/lib/analysis/crawl-coverage'

export { withRetry } from '@/lib/crawl/retry'
export { firecrawlDocumentSchema, firecrawlDocumentMetadataSchema, type FirecrawlDocument } from '@/lib/crawl/schemas'
export { extractJsonLd } from '@/lib/crawl/json-ld'

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
 * Désactive le cache de Firecrawl (`maxAge` en ms ; 0 = toujours refaire la
 * requête). Par défaut, Firecrawl sert une copie vieille de plusieurs jours :
 * un client qui corrige son site et relance son analyse se verrait alors
 * reprocher des problèmes qu'il vient de régler — et un audit qui décrit le
 * site d'avant-hier ne vaut rien.
 */
const NO_CACHE_MAX_AGE_MS = 0

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

/**
 * Marque les pages d'un crawl plafonné, pour que les règles d'existence sachent
 * qu'elles n'ont vu qu'un échantillon (cf. lib/analysis/crawl-coverage.ts).
 */
function markCrawlTruncation(
  pages: FirecrawlPageInsert[],
  input: { pagesFound: number; maxPages: number; discoveryFailed?: boolean }
): void {
  const truncated = isCrawlTruncated(input)
  for (const page of pages) {
    page.metadata = { ...(page.metadata ?? {}), [CRAWL_TRUNCATED_KEY]: truncated }
  }
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
  let discoveryFailed = false
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
    // map() indisponible → on se rabat sur la homepage uniquement. On ne sait
    // alors rien de la taille du site : le crawl compte comme tronqué.
    discoveryFailed = true
  }

  // 2. Scraper chaque URL en parallèle (requête HTTP directe, pas de polling)
  const pages: FirecrawlPageInsert[] = []
  await Promise.allSettled(
    urlsToScrape.map(async (url) => {
      try {
        const doc = await withTimeout(
          client.scrape(url, { formats: ['markdown', 'rawHtml'], maxAge: NO_CACHE_MAX_AGE_MS }),
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
          metadata: buildPageMetadata(parsed.data),
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

  markCrawlTruncation(pages, {
    pagesFound: urlsToScrape.length,
    maxPages,
    discoveryFailed,
  })
  await measureResponseTimes(pages)
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
      scrapeOptions: { formats: ['markdown', 'rawHtml'], maxAge: NO_CACHE_MAX_AGE_MS },
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
      metadata: buildPageMetadata(doc),
      statusCode: doc.metadata?.statusCode ?? null,
    })
  }

  markCrawlTruncation(pages, { pagesFound: pages.length, maxPages })
  await measureResponseTimes(pages)
  await upsertFirecrawlPages(pages)

  return { siteId, pagesCount: pages.length }
}
