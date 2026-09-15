/**
 * lib/crawl/response-time.ts
 *
 * Mesure du temps de réponse des pages crawlées.
 *
 * Pourquoi ce fichier existe : la règle `response_time_slow` lit
 * `page.metadata.loadTime`, un champ que Firecrawl ne renvoie pas et que rien ne
 * remplissait. Faute de donnée, la règle retournait `null` en silence — elle
 * n'a jamais signalé un seul site lent depuis sa mise en service. On mesure donc
 * nous-mêmes, par une requête directe sur chaque page déjà crawlée.
 *
 * La mesure est best-effort : une page injoignable reste sans `loadTime`, et la
 * règle se contente des pages mesurées (aucune, et elle ne dit rien — comme avant).
 */

import type { FirecrawlPageInsert } from '@/lib/crawl/pages'

/** Au-delà, on considère la page injoignable et on n'enregistre pas de mesure. */
const TIMEOUT_MS = 10_000
/** Requêtes simultanées — on mesure le site du client, pas sa capacité de charge. */
const CONCURRENCY = 5

/** Temps jusqu'à la fin des en-têtes de réponse, en millisecondes. */
async function measureOne(url: string): Promise<number | null> {
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
    // On libère le corps sans le lire : seule la latence d'en-tête nous intéresse.
    await res.body?.cancel()
    return elapsed
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Renseigne `metadata.loadTime` (ms) sur chaque page, en place.
 * Ne lève jamais : un échec de mesure ne doit pas faire échouer un crawl.
 */
export async function measureResponseTimes(pages: FirecrawlPageInsert[]): Promise<void> {
  const queue = [...pages]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
      const loadTime = await measureOne(page.url)
      if (loadTime === null) continue
      page.metadata = { ...(page.metadata ?? {}), loadTime }
    }
  })
  await Promise.all(workers)
}
