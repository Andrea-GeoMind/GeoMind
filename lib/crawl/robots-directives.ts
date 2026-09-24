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
 * Le 24/09 a montré que ce recoupement ne suffisait pas : sur
 * `lembellie-lyon.com`, le `noindex` que Firecrawl rapportait appartenait à
 * l'iframe utilitaire d'AddToAny — le widget de partage. Firecrawl exécute le
 * JavaScript et **aplatit les iframes dans le HTML parent**
 * (`data-original-tag="iframe"`), si bien que le `<head>` du document tiers se
 * retrouve au milieu du corps de la page. Un navigateur, lui, garde ce
 * document à part : `document.querySelectorAll('meta[name=robots]')` ne rend
 * rien. N'importe quel site utilisant AddToAny était donc signalé à tort.
 *
 * Deux garde-fous, donc : on ne lit que le `<head>` du document, et on ignore
 * les fragments aplatis par le rendu. Et la source doit être NOTRE requête, pas
 * celle de Firecrawl — `lib/crawl/page-probe.ts`.
 */

/** `<meta name="robots">` et `<meta name="googlebot">`, ordre d'attributs libre. */
const META_TAG_RE = /<meta\b[^>]*>/gi
const NAME_ATTR_RE = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i
const CONTENT_ATTR_RE = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i

/** Agents dont la directive vaut pour les moteurs de réponse. */
const INDEXING_AGENTS = new Set(['robots', 'googlebot', 'gptbot', 'claudebot', 'perplexitybot'])

/**
 * User-agents officiels des robots qui alimentent les moteurs de réponse.
 * Servent à vérifier nous-mêmes si un site leur réserve un traitement
 * particulier, plutôt que de le déduire de ce que reçoit Firecrawl.
 */
export const AI_CRAWLER_USER_AGENTS: { bot: string; ua: string }[] = [
  {
    bot: 'GPTBot',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  },
  {
    bot: 'OAI-SearchBot',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  },
  {
    bot: 'ClaudeBot',
    ua: 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  },
  {
    bot: 'PerplexityBot',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  },
  {
    bot: 'Googlebot',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
]

/** User-agent de navigateur — la référence : ce qu'un visiteur humain reçoit. */
export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

/**
 * Isole le `<head>` du document principal.
 *
 * Un `<meta name="robots">` n'a de valeur que dans le head de la page. Le
 * trouver ailleurs — dans le corps, ou dans le head d'un document tiers aplati
 * par le rendu — ne dit rien de l'intention du propriétaire du site.
 *
 * Le premier `<head>` rencontré est celui du document principal : un widget
 * aplati arrive forcément après, dans le corps. À défaut de `<head>` explicite
 * (fragment, HTML malformé), on retient tout ce qui précède le `<body>` — un
 * navigateur y placerait implicitement les balises de tête.
 */
export function mainHead(rawHtml: string): string {
  const openIndex = rawHtml.search(/<head\b[^>]*>/i)
  if (openIndex === -1) {
    const bodyIndex = rawHtml.search(/<body\b[^>]*>/i)
    return bodyIndex === -1 ? rawHtml : rawHtml.slice(0, bodyIndex)
  }
  const afterOpen = rawHtml.slice(openIndex)
  const closeIndex = afterOpen.search(/<\/head>/i)
  return closeIndex === -1 ? afterOpen : afterOpen.slice(0, closeIndex)
}

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

  // Uniquement le head du document principal : un meta robots trouvé ailleurs
  // vient d'un widget tiers, pas du site.
  const head = mainHead(rawHtml)

  const out: string[] = []
  for (const tag of head.match(META_TAG_RE) ?? []) {
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
