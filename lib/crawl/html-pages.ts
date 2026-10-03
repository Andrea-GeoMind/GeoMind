/**
 * lib/crawl/html-pages.ts
 *
 * Ce qui mérite d'être analysé comme une page.
 *
 * Raison d'être : le crawl avalait les fichiers sitemap et les passait au
 * moteur de règles comme des pages ordinaires. Un `sitemap_index.xml` se voyait
 * donc reprocher un H1 manquant, une langue non déclarée, un viewport absent,
 * des balises Open Graph et une Twitter Card — six défauts sur un fichier qui
 * n'en a évidemment aucun à avoir.
 *
 * Mesuré le 2026-10-03 : **79 des 251 constats techniques en base, soit 31 %**,
 * portaient sur des fichiers non-HTML. Sur un seul rapport client, 42 — un tiers
 * de ses points faibles n'existaient pas, et sa note Technique en pâtissait.
 *
 * Deux filtres, parce qu'aucun ne suffit seul : l'extension attrape le cas
 * courant avant même de télécharger, le content-type attrape le reste — un
 * sitemap servi sans extension, une route d'API qui rend du JSON.
 */

/** Extensions qui ne désignent jamais une page à analyser. */
const NON_HTML_EXTENSIONS = [
  'xml', 'txt', 'json', 'rss', 'atom', 'csv', 'tsv',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'gz', 'tar', 'rar', '7z',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp',
  'mp3', 'mp4', 'wav', 'webm', 'mov', 'avi', 'ogg',
  'css', 'js', 'mjs', 'map', 'woff', 'woff2', 'ttf', 'otf', 'eot',
]

const EXTENSION_RE = new RegExp(`\\.(${NON_HTML_EXTENSIONS.join('|')})$`, 'i')

/**
 * Faux pour une URL dont l'extension annonce autre chose qu'une page.
 *
 * On ne juge que sur l'extension du chemin : une URL sans extension reste
 * candidate, c'est le content-type qui tranchera après la réponse.
 */
export function isHtmlCandidateUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return !EXTENSION_RE.test(pathname)
  } catch {
    // URL illisible : on ne la retient pas, il n'y a rien à en tirer.
    return false
  }
}

/**
 * Faux pour un content-type qui n'est pas une page.
 *
 * `undefined` renvoie `true` : beaucoup de réponses n'exposent pas l'en-tête à
 * ce stade, et écarter par défaut reviendrait à perdre des pages valides.
 */
export function isHtmlContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return true
  const type = contentType.split(';')[0]!.trim().toLowerCase()
  return type === '' || type === 'text/html' || type === 'application/xhtml+xml'
}

/** Les deux filtres réunis, pour une page déjà récupérée. */
export function isAnalyzablePage(url: string, contentType?: string | null): boolean {
  return isHtmlCandidateUrl(url) && isHtmlContentType(contentType)
}
