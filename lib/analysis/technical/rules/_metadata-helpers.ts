import type { FirecrawlPage } from '../types'

/**
 * Helpers partagés pour lire prudemment les métadonnées Firecrawl.
 * Les clés supplémentaires (ogTitle, viewport, robots, canonical…) passent par
 * l'index signature de FirecrawlPageMetadata : on vérifie toujours le type.
 */

/** Retourne la première valeur string non vide trouvée parmi les clés données. */
export function getMetaString(page: FirecrawlPage, ...keys: string[]): string | null {
  const metadata = page.metadata
  if (!metadata) return null
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim() !== '') return value
  }
  return null
}

/** Profondeur d'une URL = nombre de segments du pathname (/ = 0, /blog/post = 2). */
export function urlDepth(url: string): number {
  try {
    const { pathname } = new URL(url)
    return pathname.split('/').filter(Boolean).length
  } catch {
    return 0
  }
}
