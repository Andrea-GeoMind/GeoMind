/**
 * lib/analysis/crawl-coverage.ts
 *
 * Un crawl est plafonné (`maxPages`). Quand il atteint ce plafond, les pages
 * rapportées ne sont qu'un échantillon : le site en contient d'autres, qu'on n'a
 * pas lues.
 *
 * Deux familles de règles cohabitent, et elles ne réagissent pas pareil à un
 * échantillon :
 *
 *  - les règles **proportionnelles** (longueur médiane, densité d'entités, part
 *    de pages sans listes, taux d'erreurs) restent valides : une proportion
 *    mesurée sur un échantillon reste une proportion ;
 *  - les règles **d'existence** (« aucune page À propos », « aucun contenu FAQ »,
 *    « aucune date récente ») ne le sont pas : une seule page non crawlée suffit
 *    à les démentir. Sur un crawl plafonné, elles décrivent la couverture du
 *    crawl, pas le site — et le client se voit reprocher ce qu'il publie.
 *
 * On enregistre donc la troncature au moment du crawl, et les règles d'existence
 * se taisent quand elle est avérée. Mieux vaut un constat manquant qu'un constat
 * faux : c'est le client qui se fie au rapport.
 */

interface PageWithMetadata {
  metadata?: Record<string, unknown> | null
}

/** Clé posée sur les métadonnées de chaque page issue d'un crawl plafonné. */
export const CRAWL_TRUNCATED_KEY = 'crawlTruncated'

/**
 * Le crawl a-t-il atteint son plafond ? `pagesFound >= maxPages` signifie qu'il
 * restait probablement des pages à explorer. Un `map()` en échec — qui fait
 * retomber la découverte sur la seule page d'accueil — compte aussi comme
 * tronqué : on ne sait alors rien de la taille du site.
 */
export function isCrawlTruncated({
  pagesFound,
  maxPages,
  discoveryFailed = false,
}: {
  pagesFound: number
  maxPages: number
  discoveryFailed?: boolean
}): boolean {
  return discoveryFailed || pagesFound >= maxPages
}

/** Le lot de pages provient-il d'un crawl plafonné ? */
export function crawlWasTruncated(pages: PageWithMetadata[]): boolean {
  return pages.some((p) => p.metadata?.[CRAWL_TRUNCATED_KEY] === true)
}
