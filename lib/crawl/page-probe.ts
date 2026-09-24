/**
 * lib/crawl/page-probe.ts
 *
 * Sonde HTTP directe sur chaque page crawlée : nos propres mesures, celles que
 * Firecrawl ne fournit pas ou qu'on ne peut pas lui laisser établir seul.
 *
 * 1. `metadata.loadTime` — la règle `response_time_slow` le lit, rien ne le
 *    remplissait, et elle n'a donc jamais signalé un seul site lent.
 * 2. `metadata.robotsSelf` — les directives d'indexation lues dans le `<head>`
 *    de NOTRE requête, avec un user-agent de navigateur. C'est la référence :
 *    ce qu'un visiteur reçoit.
 * 3. `metadata.xRobotsTag` — l'en-tête `X-Robots-Tag`, invisible dans le HTML.
 * 4. `metadata.robotsForBot` — renseigné seulement quand Firecrawl annonce un
 *    `noindex` que notre lecture navigateur ne voit pas. On repose alors la
 *    question avec les user-agents officiels des robots d'IA, pour savoir si
 *    le site leur réserve un traitement particulier, et lequel.
 *
 * Pourquoi cette gymnastique : le 24/09, `lembellie-lyon.com` a été signalé
 * « page clé en noindex » à tort. Le `noindex` venait de l'iframe utilitaire
 * d'AddToAny, que le rendu de Firecrawl aplatit dans le HTML parent. Aucun des
 * neuf user-agents testés — navigateur, GPTBot, ClaudeBot, PerplexityBot,
 * Googlebot, Google-Extended, OAI-SearchBot, curl — ne recevait de directive :
 * le site était parfaitement indexable, et le client aurait lu le contraire.
 *
 * La sonde est best-effort : une page injoignable reste sans mesure, et les
 * règles se contentent de ce qui a été relevé.
 */

import type { FirecrawlPageInsert } from '@/lib/crawl/pages'
import {
  AI_CRAWLER_USER_AGENTS,
  BROWSER_USER_AGENT,
  extractMetaRobots,
  hasNoindex,
  parseXRobotsTag,
} from '@/lib/crawl/robots-directives'

/** Au-delà, on considère la page injoignable et on n'enregistre rien. */
const TIMEOUT_MS = 10_000
/** Requêtes simultanées — on mesure le site du client, pas sa capacité de charge. */
const CONCURRENCY = 5
/** Un head tient largement là-dedans ; inutile de rapatrier des mégaoctets. */
const MAX_BYTES = 600_000

export interface RobotsForBot {
  bot: string
  directives: string[]
}

interface Probe {
  /** Temps jusqu'à la fin des en-têtes de réponse, en millisecondes. */
  loadTime: number
  /** Valeur brute de `X-Robots-Tag`, ou null quand l'en-tête est absent. */
  xRobotsTag: string | null
  /** Directives du head, lues avec un user-agent de navigateur. */
  robotsSelf: string[]
}

async function fetchWithUa(
  url: string,
  userAgent: string
): Promise<{ html: string; xRobotsTag: string | null; elapsed: number } | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': userAgent },
    })
    const elapsed = Date.now() - startedAt
    const xRobotsTag = res.headers.get('x-robots-tag')
    const html = (await res.text()).slice(0, MAX_BYTES)
    return { html, xRobotsTag, elapsed }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function probeOne(url: string): Promise<Probe | null> {
  const res = await fetchWithUa(url, BROWSER_USER_AGENT)
  if (!res) return null
  return {
    loadTime: res.elapsed,
    xRobotsTag: res.xRobotsTag,
    robotsSelf: extractMetaRobots(res.html) ?? [],
  }
}

/**
 * Le site sert-il une consigne d'indexation à l'un des robots d'IA ?
 *
 * Appelé seulement en cas de divergence, donc rarement : une requête par robot
 * et uniquement sur les pages concernées.
 */
export async function probeAiCrawlers(url: string): Promise<RobotsForBot | null> {
  for (const { bot, ua } of AI_CRAWLER_USER_AGENTS) {
    const res = await fetchWithUa(url, ua)
    if (!res) continue
    const directives = [
      ...(extractMetaRobots(res.html) ?? []),
      ...parseXRobotsTag(res.xRobotsTag),
    ]
    if (hasNoindex(directives)) return { bot, directives }
  }
  return null
}

/**
 * Renseigne les mesures de sonde sur chaque page, en place.
 * Ne lève jamais : un échec de sonde ne doit pas faire échouer un crawl.
 */
export async function probePages(pages: FirecrawlPageInsert[]): Promise<void> {
  const queue = [...pages]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
      const probe = await probeOne(page.url)
      if (probe === null) continue

      const metadata: Record<string, unknown> = {
        ...(page.metadata ?? {}),
        loadTime: probe.loadTime,
        // Distinguer « en-tête absent » de « page non sondée » : la règle
        // noindex traite le premier comme une preuve d'absence, pas le second.
        xRobotsTag: probe.xRobotsTag,
        robotsSelf: probe.robotsSelf,
      }

      // Firecrawl voit un noindex que notre lecture navigateur ne voit pas :
      // soit le site le réserve aux robots, soit c'est un artefact de rendu.
      // On tranche en le demandant nous-mêmes aux robots concernés.
      const firecrawlSaysNoindex = hasNoindex(
        typeof page.metadata?.robots === 'string'
          ? [page.metadata.robots]
          : Array.isArray(page.metadata?.robots)
            ? (page.metadata.robots as string[])
            : []
      )
      const selfSaysNoindex =
        hasNoindex(probe.robotsSelf) || hasNoindex(parseXRobotsTag(probe.xRobotsTag))

      if (firecrawlSaysNoindex && !selfSaysNoindex) {
        const forBot = await probeAiCrawlers(page.url)
        metadata.robotsForBot = forBot
        if (!forBot) {
          // Personne d'autre que Firecrawl ne le voit : on n'en dit rien au
          // client, mais on le garde pour nous.
          console.warn(
            `[GeoMind/probe] noindex vu par Firecrawl seul sur ${page.url} — ` +
              `ni le navigateur ni les robots d'IA ne le reçoivent, constat masqué.`
          )
        }
      }

      page.metadata = metadata
    }
  })
  await Promise.all(workers)
}
