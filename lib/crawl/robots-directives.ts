/**
 * lib/crawl/robots-directives.ts
 *
 * Lecture des directives d'indexation à la source, pour ne plus dépendre du
 * seul champ `robots` que renvoie Firecrawl.
 *
 * Pourquoi ce fichier existe : le 2026-09-23, la règle `noindex_on_key_pages`
 * a signalé « page clé en noindex » sur deux sites qui n'en portent aucun.
 * Vérifié à trois niveaux — requête HTTP brute, en-têtes de réponse, DOM rendu
 * dans un vrai navigateur : zéro `meta[name=robots]` sur `lembellie-lyon.com`
 * et sur `l-atelier-du-square.eatbu.com`. Firecrawl, lui, renvoyait
 * `metadata.robots = "noindex"`, et une fois `["noindex","noindex"]` — un
 * doublon qui ressemble à une page d'obstacle anti-bot servie au crawler
 * plutôt qu'à la page réelle.
 *
 * On extrait donc les directives nous-mêmes, du HTML brut et de l'en-tête
 * `X-Robots-Tag`, et la règle n'affirme rien sans l'une des deux.
 */

/** `<meta name="robots">` et `<meta name="googlebot">`, ordre d'attributs libre. */
const META_TAG_RE = /<meta\b[^>]*>/gi
const NAME_ATTR_RE = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i
const CONTENT_ATTR_RE = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i

/** Agents dont la directive vaut pour les moteurs de réponse. */
const INDEXING_AGENTS = new Set(['robots', 'googlebot', 'gptbot', 'claudebot', 'perplexitybot'])

function attr(tag: string, re: RegExp): string | null {
  const m = re.exec(tag)
  if (!m) return null
  return (m[1] ?? m[2] ?? m[3] ?? '').trim()
}

/**
 * Contenus des balises meta d'indexation présentes dans le HTML brut.
 * Renvoie `null` quand le HTML n'est pas disponible — « je ne sais pas » est
 * une réponse différente de « il n'y en a pas », et la règle en tient compte.
 */
export function extractMetaRobots(rawHtml: string | null | undefined): string[] | null {
  if (typeof rawHtml !== 'string' || rawHtml.trim() === '') return null

  const out: string[] = []
  for (const tag of rawHtml.match(META_TAG_RE) ?? []) {
    const name = attr(tag, NAME_ATTR_RE)?.toLowerCase()
    if (!name || !INDEXING_AGENTS.has(name)) continue
    const content = attr(tag, CONTENT_ATTR_RE)
    if (content) out.push(content)
  }
  return out
}

/**
 * Directives portées par l'en-tête `X-Robots-Tag`.
 *
 * L'en-tête accepte une forme préfixée par l'agent — `googlebot: noindex` — et
 * plusieurs valeurs séparées par des virgules. On ne garde que les directives
 * sans agent ou adressées à un agent d'indexation.
 */
export function parseXRobotsTag(header: string | null | undefined): string[] {
  if (!header) return []
  const out: string[] = []
  for (const part of header.split(',')) {
    const value = part.trim()
    if (!value) continue
    const colon = value.indexOf(':')
    if (colon === -1) {
      out.push(value)
      continue
    }
    const agent = value.slice(0, colon).trim().toLowerCase()
    const directive = value.slice(colon + 1).trim()
    // `unavailable_after: 2026-01-01` porte une date, pas un agent.
    if (!INDEXING_AGENTS.has(agent)) {
      out.push(value)
      continue
    }
    if (directive) out.push(directive)
  }
  return out
}

/** Vrai si l'une des directives demande explicitement la désindexation. */
export function hasNoindex(directives: readonly string[] | null | undefined): boolean {
  if (!directives) return false
  return directives.some((d) =>
    d
      .toLowerCase()
      .split(/[,\s]+/)
      .some((token) => token === 'noindex' || token === 'none')
  )
}
