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

const HEADING_RE = (level: 1 | 2) => new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, 'gi')

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

/**
 * Titres H1 et H2 d'une page. Renvoie `null` quand il n'y a pas de HTML à lire —
 * les règles retombent alors sur leur analyse du markdown, comme avant.
 */
export function extractHeadings(
  html: string | null | undefined
): { h1: string[]; h2: string[] } | null {
  if (!html) return null
  return { h1: extractLevel(html, 1), h2: extractLevel(html, 2) }
}
