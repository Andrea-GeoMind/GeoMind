/**
 * lib/crawl/page-probe.ts
 *
 * Sonde HTTP directe sur chaque page crawlée : une requête, deux mesures que
 * Firecrawl ne fournit pas.
 *
 * 1. `metadata.loadTime` — la règle `response_time_slow` le lit, rien ne le
 *    remplissait, et elle n'a donc jamais signalé un seul site lent.
 * 2. `metadata.xRobotsTag` — l'en-tête `X-Robots-Tag`, seule directive
 *    d'indexation invisible dans le HTML. Sans elle, `noindex_on_key_pages`
 *    n'avait que le champ `robots` de Firecrawl pour se prononcer, et ce champ
 *    s'est révélé faux sur deux sites réels (voir `lib/crawl/robots-directives.ts`).
 *
 * Les deux se lisent sur la même réponse : le recoupement ne coûte aucune
 * requête supplémentaire.
 *
 * La sonde est best-effort : une page injoignable reste sans mesure, et les
 * règles se contentent de ce qui a été relevé.
 */

import type { FirecrawlPageInsert } from '@/lib/crawl/pages'

/** Au-delà, on considère la page injoignable et on n'enregistre rien. */
const TIMEOUT_MS = 10_000
/** Requêtes simultanées — on mesure le site du client, pas sa capacité de charge. */
const CONCURRENCY = 5

interface Probe {
  /** Temps jusqu'à la fin des en-têtes de réponse, en millisecondes. */
  loadTime: number
  /** Valeur brute de `X-Robots-Tag`, ou null quand l'en-tête est absent. */
  xRobotsTag: string | null
}

async function probeOne(url: string): Promise<Probe | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'GeomindBot/1.0 (+https://geomind.fr)' },
    })
    const elapsed = Date.now() - startedAt
    const xRobotsTag = res.headers.get('x-robots-tag')
    // On libère le corps sans le lire : seuls la latence et les en-têtes comptent.
    await res.body?.cancel()
    return { loadTime: elapsed, xRobotsTag }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Renseigne `metadata.loadTime` et `metadata.xRobotsTag` sur chaque page, en place.
 * Ne lève jamais : un échec de sonde ne doit pas faire échouer un crawl.
 */
export async function probePages(pages: FirecrawlPageInsert[]): Promise<void> {
  const queue = [...pages]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
      const probe = await probeOne(page.url)
      if (probe === null) continue
      page.metadata = {
        ...(page.metadata ?? {}),
        loadTime: probe.loadTime,
        // Distinguer « en-tête absent » de « page non sondée » : la règle
        // noindex traite le premier comme une preuve d'absence, pas le second.
        xRobotsTag: probe.xRobotsTag,
      }
    }
  })
  await Promise.all(workers)
}
