/**
 * Helpers d'URL partagés par les règles.
 *
 * Une page de section (`/blog/`, `/actualites/`) est un INDEX, pas un article :
 * la confondre avec un article lui reprochait un schema Article et un auteur
 * qu'elle n'a aucune raison de déclarer. Un article a toujours au moins un
 * segment après la racine de section.
 */

const ARTICLE_SECTIONS = ['blog', 'article', 'articles', 'actu', 'actus', 'news', 'post', 'posts', 'actualite', 'actualites']

function segmentsOf(url: string): string[] | null {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)
  } catch {
    return null
  }
}

/** L'URL désigne-t-elle un article publié dans une section éditoriale ? */
export function isArticleUrl(url: string): boolean {
  const segments = segmentsOf(url)
  if (!segments) return false
  const index = segments.findIndex((s) => ARTICLE_SECTIONS.includes(s.toLowerCase()))
  // Section absente, ou présente mais en dernier segment → c'est l'index, pas un article.
  return index !== -1 && index < segments.length - 1
}

/** L'URL est-elle la racine d'une section éditoriale (page index) ? */
export function isSectionIndexUrl(url: string): boolean {
  const segments = segmentsOf(url)
  if (!segments || segments.length === 0) return false
  return ARTICLE_SECTIONS.includes(segments[segments.length - 1].toLowerCase())
}
