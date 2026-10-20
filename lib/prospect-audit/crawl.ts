/**
 * Lecture du site d'un prospect — en mémoire, sans base : 1 map + 5 pages au
 * plus (6 crédits Firecrawl), choisies pour ce qu'un client y cherche :
 * l'accueil, le contact, les prestations et les tarifs.
 *
 * Mêmes briques que la production (schéma Firecrawl, `buildPageMetadata`,
 * sonde des en-têtes) pour que les règles Technique et Contenu voient les
 * pages sous la forme exacte qu'elles voient pour un client.
 */

import FirecrawlApp from '@mendable/firecrawl-js'
import { env } from '@/lib/env'
import { firecrawlDocumentSchema } from '@/lib/crawl/schemas'
import { buildPageMetadata, type FirecrawlPageInsert } from '@/lib/crawl/pages'
import { probePages } from '@/lib/crawl/page-probe'
import { isAnalyzablePage, isHtmlCandidateUrl } from '@/lib/crawl/html-pages'
import { isCrawlTruncated, CRAWL_TRUNCATED_KEY } from '@/lib/analysis/crawl-coverage'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const MAP_TIMEOUT_MS = 20_000
const SCRAPE_TIMEOUT_MS = 30_000

/** Par ordre de priorité : ce qu'un client vient chercher sur le site. */
const PRIORITY_PATTERNS: RegExp[] = [
  /contact|nous-trouver|acces|plan-d-acces|coordonnees/,
  /tarif|prix|price|grille/,
  /prestation|service|soin|coupe|coaching|cours|offre|formule|abonnement|planning|carte/,
  /a-propos|qui-sommes|about|equipe|histoire|le-salon|la-salle/,
]

function normalizedPath(url: string): string | null {
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  } catch {
    return null
  }
}

function sameSite(a: string, b: string): boolean {
  try {
    const host = (u: string) => new URL(u).hostname.replace(/^www\./, '')
    return host(a) === host(b)
  } catch {
    return false
  }
}

/**
 * Pages à lire : l'accueil d'abord, puis une page par motif de priorité, puis
 * les chemins les plus courts. Pure et déterministe.
 */
export function choosePagesToRead(home: string, links: string[], max: number): string[] {
  const candidates = [...new Set(links)]
    .filter((u) => u.startsWith('http') && sameSite(u, home) && isHtmlCandidateUrl(u))
    .filter((u) => normalizedPath(u) !== null)
  const chosen: string[] = [home]
  const isHome = (u: string) => (normalizedPath(u) ?? '/').replace(/\/+$/, '') === ''
  const rest = candidates.filter((u) => !isHome(u))
  for (const pattern of PRIORITY_PATTERNS) {
    if (chosen.length >= max) break
    const hit = rest
      .filter((u) => !chosen.includes(u) && pattern.test(normalizedPath(u) ?? ''))
      .sort((a, b) => a.length - b.length || a.localeCompare(b))[0]
    if (hit) chosen.push(hit)
  }
  for (const u of rest.sort((a, b) => a.length - b.length || a.localeCompare(b))) {
    if (chosen.length >= max) break
    if (!chosen.includes(u)) chosen.push(u)
  }
  return chosen.slice(0, max)
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} : timeout après ${ms / 1000} s`)), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

export interface ProspectCrawlResult {
  pages: FirecrawlPage[]
  /** Adresses demandées, lues ou non. */
  requested: string[]
  /** Crédits Firecrawl consommés (1 par map, 1 par page demandée). */
  credits: number
}

export async function readProspectSite(siteUrl: string, maxPages = 5): Promise<ProspectCrawlResult> {
  const client = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY })
  let links: string[] = []
  let mapFailed = false
  try {
    const mapped = await withTimeout(client.map(siteUrl, { limit: 50 }), MAP_TIMEOUT_MS, 'map')
    links = (mapped.links ?? []).map((l) => l.url).filter((u): u is string => typeof u === 'string')
  } catch (err) {
    mapFailed = true
    console.error(`[prospect-audit] map ${siteUrl} : ${err instanceof Error ? err.message : String(err)}`)
  }

  const requested = choosePagesToRead(siteUrl, links, maxPages)
  const pages: FirecrawlPageInsert[] = []
  // Une page à la fois : le plan Firecrawl limite le débit, et 5 pages lues
  // en série tiennent en moins d'une minute.
  for (const url of requested) {
    try {
      const doc = await withTimeout(
        client.scrape(url, { formats: ['markdown', 'rawHtml'], maxAge: 0 }),
        SCRAPE_TIMEOUT_MS,
        `scrape ${url}`
      )
      const parsed = firecrawlDocumentSchema.safeParse(doc)
      if (!parsed.success) continue
      const finalUrl = parsed.data.metadata?.url ?? url
      const ct = (parsed.data.metadata as Record<string, unknown> | undefined)?.contentType
      if (!isAnalyzablePage(finalUrl, typeof ct === 'string' ? ct : null)) continue
      pages.push({
        siteId: 'prospect',
        url: finalUrl,
        markdown: parsed.data.markdown ?? null,
        metadata: buildPageMetadata(parsed.data),
        statusCode: parsed.data.metadata?.statusCode ?? null,
      })
    } catch (err) {
      console.error(`[prospect-audit] ${url} illisible : ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const truncated = isCrawlTruncated({
    pagesFound: Math.max(links.length, requested.length),
    maxPages,
    discoveryFailed: mapFailed,
  })
  for (const page of pages) {
    page.metadata = { ...(page.metadata ?? {}), [CRAWL_TRUNCATED_KEY]: truncated }
  }
  await probePages(pages)

  return {
    pages: pages.map((p) => ({
      url: p.url,
      markdown: p.markdown,
      statusCode: p.statusCode,
      metadata: p.metadata as unknown as FirecrawlPage['metadata'],
    })),
    requested,
    credits: 1 + requested.length,
  }
}
