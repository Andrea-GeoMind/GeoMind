/**
 * lib/crawl/document-scope.ts
 *
 * Quelle partie du HTML appartient vraiment à la page analysée.
 *
 * Firecrawl exécute le JavaScript et **aplatit les documents embarqués dans le
 * HTML parent** : une iframe devient un `<div data-original-tag="iframe">` qui
 * contient son propre `<!DOCTYPE>`, son `<html>`, son `<head>` et ses balises.
 * Le 24/09/2026, l'iframe utilitaire d'AddToAny a ainsi fait signaler
 * `lembellie-lyon.com` en « page clé en noindex » alors que le site est
 * parfaitement indexable.
 *
 * Le même piège vaut pour toute balise censée être unique au document : un
 * `<title>`, un `<h1>`, un `<link rel=canonical>`, un `lang`, un bloc JSON-LD
 * ou une balise Open Graph appartenant à un widget tiers n'a rien à dire du
 * site du client. On retire donc ces sous-documents avant toute extraction.
 */

/** Taille max analysée — borne de sécurité contre une page anormale. */
const MAX_HTML_LENGTH = 5_000_000

/**
 * Éléments qui portent un document étranger. `data-original-tag` est la marque
 * que laisse le rendu de Firecrawl quand il convertit une iframe en div.
 */
const EMBEDDED_OPEN_RE =
  /<(div|iframe|frame|object|embed|template|noscript)\b[^>]*?(?:data-original-tag\s*=\s*["'](?:iframe|frame|object|embed)["'])[^>]*>/gi

/** Documents embarqués restés sous leur vraie balise. */
const REAL_EMBED_RE =
  /<(iframe|frame|object|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi

/**
 * Trouve la fin de l'élément ouvert en `start`, en comptant les ouvertures et
 * fermetures de la même balise. Un `indexOf('</div>')` naïf s'arrêterait au
 * premier div imbriqué et laisserait passer la moitié du sous-document.
 */
function findElementEnd(html: string, tag: string, start: number): number {
  const open = new RegExp(`<${tag}\\b`, 'gi')
  const close = new RegExp(`</${tag}\\s*>`, 'gi')
  let depth = 0
  let cursor = start

  while (cursor < html.length) {
    open.lastIndex = cursor
    close.lastIndex = cursor
    const nextOpen = open.exec(html)
    const nextClose = close.exec(html)
    if (!nextClose) return html.length

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++
      cursor = nextOpen.index + 1
      continue
    }
    depth--
    cursor = nextClose.index + nextClose[0].length
    if (depth === 0) return cursor
  }
  return html.length
}

/**
 * Retire les documents embarqués du HTML.
 *
 * Ce qui reste est le document du client, et lui seul. Opération purement
 * textuelle : aucune dépendance, aucun parseur, et le coût reste linéaire.
 */
export function stripEmbeddedDocuments(html: string): string {
  if (html.length > MAX_HTML_LENGTH) html = html.slice(0, MAX_HTML_LENGTH)

  let out = html
  // 1. Les sous-documents aplatis par le rendu, retirés avec leur sous-arbre.
  for (let guard = 0; guard < 50; guard++) {
    EMBEDDED_OPEN_RE.lastIndex = 0
    const match = EMBEDDED_OPEN_RE.exec(out)
    if (!match) break
    const tag = match[1]!
    const end = findElementEnd(out, tag, match.index)
    out = out.slice(0, match.index) + out.slice(end)
  }
  // 2. Les iframes, templates et noscript restés sous leur vraie balise.
  out = out.replace(REAL_EMBED_RE, ' ')
  return out
}

/**
 * Isole le `<head>` du document principal, sous-documents déjà retirés.
 *
 * Le premier `<head>` rencontré est celui du document principal. À défaut de
 * `<head>` explicite (fragment, HTML malformé), on retient tout ce qui précède
 * le `<body>` — un navigateur y placerait implicitement les balises de tête.
 */
export function mainHead(rawHtml: string): string {
  const html = stripEmbeddedDocuments(rawHtml)
  const openIndex = html.search(/<head\b[^>]*>/i)
  if (openIndex === -1) {
    const bodyIndex = html.search(/<body\b[^>]*>/i)
    return bodyIndex === -1 ? html : html.slice(0, bodyIndex)
  }
  const afterOpen = html.slice(openIndex)
  const closeIndex = afterOpen.search(/<\/head>/i)
  return closeIndex === -1 ? afterOpen : afterOpen.slice(0, closeIndex)
}

/** Valeur d'un attribut sur la première balise correspondante. */
function attrOfFirstTag(html: string, tagRe: RegExp, attr: string): string | null {
  const tag = tagRe.exec(html)?.[0]
  if (!tag) return null
  const m = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(tag)
  const value = (m?.[1] ?? m?.[2] ?? m?.[3] ?? '').trim()
  return value === '' ? null : value
}

const META_TAG_RE = /<meta\b[^>]*>/gi

/** Contenu de la première `<meta>` dont `name` ou `property` vaut `key`. */
function metaContent(head: string, key: string): string | null {
  META_TAG_RE.lastIndex = 0
  for (const tag of head.match(META_TAG_RE) ?? []) {
    const name = (
      attrOfFirstTag(tag, /<meta\b[^>]*>/i, 'name') ??
      attrOfFirstTag(tag, /<meta\b[^>]*>/i, 'property') ??
      ''
    ).toLowerCase()
    if (name !== key.toLowerCase()) continue
    const content = attrOfFirstTag(tag, /<meta\b[^>]*>/i, 'content')
    if (content) return content
  }
  return null
}

export interface DocumentMeta {
  title: string | null
  description: string | null
  canonical: string | null
  language: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  twitterCard: string | null
  viewport: string | null
}

/**
 * Balises uniques du document principal, lues par nous.
 *
 * Firecrawl renseigne déjà `title`, `description`, `language`, `og:*`… mais son
 * parseur voit le HTML aplati, donc il peut rapporter celles d'un widget tiers.
 * On refait l'extraction sur le document nettoyé : c'est la même logique que
 * pour `h1`/`h2` et `schemaOrgs`, qu'on produit déjà nous-mêmes.
 */
export function extractDocumentMeta(rawHtml: string | null | undefined): DocumentMeta | null {
  if (typeof rawHtml !== 'string' || rawHtml.trim() === '') return null
  const clean = stripEmbeddedDocuments(rawHtml)
  const head = mainHead(rawHtml)

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head)
  const title = titleMatch
    ? titleMatch[1]!.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null
    : null

  // `lang` se lit sur la balise <html> du document principal — la première.
  const language = attrOfFirstTag(clean, /<html\b[^>]*>/i, 'lang')

  const canonicalTag = /<link\b[^>]*\brel\s*=\s*["']?canonical["']?[^>]*>/i.exec(head)?.[0]
  const canonical = canonicalTag
    ? attrOfFirstTag(canonicalTag, /<link\b[^>]*>/i, 'href')
    : null

  return {
    title,
    description: metaContent(head, 'description'),
    canonical,
    language,
    ogTitle: metaContent(head, 'og:title'),
    ogDescription: metaContent(head, 'og:description'),
    ogImage: metaContent(head, 'og:image'),
    twitterCard: metaContent(head, 'twitter:card'),
    viewport: metaContent(head, 'viewport'),
  }
}
