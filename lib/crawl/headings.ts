/**
 * lib/crawl/headings.ts
 *
 * Extraction des titres H1/H2 depuis le HTML brut d'une page crawlée.
 *
 * Pourquoi ce fichier existe : les règles de structure lisent `metadata.h1` /
 * `metadata.h2`, que Firecrawl ne renvoie pas. Elles se rabattaient sur le
 * markdown — or le convertisseur de Firecrawl perd régulièrement les titres
 * placés dans un en-tête ou une bannière. Résultat constaté sur un site client :
 * « H1 manquant » sur trois pages qui en servent chacune exactement un.
 */

const HEADING_RE = (level: number) => new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, 'gi')
/** Tous les titres dans l'ordre du document, avec leur niveau. */
const ANY_HEADING_RE = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&eacute;': 'é',
  '&egrave;': 'è',
  '&agrave;': 'à',
  '&ccedil;': 'ç',
}

/** Texte lisible d'un titre : balises internes retirées, entités courantes décodées. */
function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLevel(html: string, level: 1 | 2): string[] {
  return [...html.matchAll(HEADING_RE(level))]
    .map((m) => toText(m[1] ?? ''))
    .filter((text) => text !== '')
}

export interface PageHeadings {
  h1: string[]
  h2: string[]
  /**
   * Niveaux des titres dans l'ordre du document (`[1, 2, 3, 3]`). Le markdown de
   * Firecrawl réordonne et perd des titres : sur un index de blog, il ne rend que
   * les H3 des vignettes, ce qui faisait conclure à tort à un « saut de niveau ».
   */
  levels: number[]
}

/**
 * Titres d'une page lus dans le HTML. Renvoie `null` quand il n'y a pas de HTML à
 * lire — les règles retombent alors sur leur analyse du markdown, comme avant.
 */
export function extractHeadings(html: string | null | undefined): PageHeadings | null {
  if (!html) return null
  const levels = [...html.matchAll(ANY_HEADING_RE)]
    .filter((m) => toText(m[2] ?? '') !== '')
    .map((m) => Number(m[1]))
  return { h1: extractLevel(html, 1), h2: extractLevel(html, 2), levels }
}
