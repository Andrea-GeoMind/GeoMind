// Types et helpers purs pour les pages crawlées — sans dépendance I/O, donc
// importable dans les tests unitaires (le module DB ouvre une connexion au chargement).

export type FirecrawlPageInsert = {
  siteId: string
  url: string
  markdown: string | null
  metadata: Record<string, unknown> | null
  statusCode: number | null
}

/**
 * Dédoublonne un lot de pages par (siteId, url) en gardant la dernière occurrence.
 *
 * Indispensable avant l'upsert batch : plusieurs URLs sources peuvent se
 * canonicaliser vers la même `metadata.url` (sites builder type eatbu/DISH où
 * `/`, le domaine nu et `?lang=xx` renvoient tous la même page). Postgres rejette
 * un `INSERT ... ON CONFLICT DO UPDATE` qui affecte deux fois la même ligne cible
 * dans une seule requête → tout l'insert échoue, 0 page écrite, découverte bloquée.
 */
export function dedupeFirecrawlPages(pages: FirecrawlPageInsert[]): FirecrawlPageInsert[] {
  return Array.from(new Map(pages.map((p) => [`${p.siteId}\n${p.url}`, p])).values())
}
