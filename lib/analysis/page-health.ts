/**
 * lib/analysis/page-health.ts
 *
 * Une page dont le scrape a échoué (5xx transitoire de Firecrawl, 404, timeout)
 * arrive avec des métadonnées vides. Passée aux règles à scope page, elle produit
 * une volée de faux « points faibles » — lang manquant, viewport manquant,
 * canonical manquant, aucun balisage — sur une page qui, en réalité, est en
 * ligne et correcte. Constaté sur un site client : trois alertes « moderate »
 * imputées à une page servie en 200 que Firecrawl avait renvoyée en 500.
 *
 * Les règles à scope SITE, elles, ont besoin des pages en échec (http_errors_ratio
 * les compte) : ce filtre ne s'applique qu'aux règles à scope page.
 */

interface PageWithStatus {
  statusCode?: number | null
}

/**
 * Le scrape a-t-il réussi ? Un `statusCode` absent reste accepté : certaines
 * sources ne le renseignent pas, et on ne veut pas écarter la page pour autant.
 */
export function wasScrapedSuccessfully(page: PageWithStatus): boolean {
  return page.statusCode == null || page.statusCode === 200
}

/** Écarte les pages dont le scrape a échoué, avant les règles à scope page. */
export function analysablePages<T extends PageWithStatus>(pages: T[]): T[] {
  return pages.filter(wasScrapedSuccessfully)
}
