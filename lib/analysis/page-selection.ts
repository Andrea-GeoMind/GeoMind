/**
 * lib/analysis/page-selection.ts
 *
 * Sélection des pages pour l'analyse page par page (cahier-des-charges §18.2).
 * Pure et déterministe : la page d'accueil est toujours incluse, puis les pages
 * sont choisies par profondeur croissante, longueur de contenu décroissante,
 * avec diversité de sections (round-robin sur le premier segment d'URL).
 */

interface SelectablePage {
  url: string
  markdown?: string | null
}

function pathInfo(url: string): { path: string; depth: number; firstSegment: string } {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '') || '/'
    const segments = path.split('/').filter(Boolean)
    return { path, depth: segments.length, firstSegment: segments[0] ?? '' }
  } catch {
    return { path: url, depth: 99, firstSegment: '' }
  }
}

export function selectPagesForAnalysis<T extends SelectablePage>(pages: T[], limit: number): T[] {
  if (!Number.isFinite(limit) || limit <= 0 || pages.length === 0) return []

  // Dédoublonnage par URL (le crawl peut contenir des doublons trailing-slash)
  const seen = new Set<string>()
  const unique = pages.filter((p) => {
    const key = pathInfo(p.url).path
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const home = unique.find((p) => pathInfo(p.url).depth === 0)
  const rest = unique.filter((p) => p !== home)

  // Tri : profondeur croissante → contenu le plus riche → URL (déterminisme)
  const sorted = [...rest].sort((a, b) => {
    const ia = pathInfo(a.url)
    const ib = pathInfo(b.url)
    if (ia.depth !== ib.depth) return ia.depth - ib.depth
    const la = a.markdown?.length ?? 0
    const lb = b.markdown?.length ?? 0
    if (la !== lb) return lb - la
    return a.url.localeCompare(b.url)
  })

  // Diversité de sections : round-robin sur le premier segment d'URL
  const groups = new Map<string, T[]>()
  const groupOrder: string[] = []
  for (const page of sorted) {
    const segment = pathInfo(page.url).firstSegment
    if (!groups.has(segment)) {
      groups.set(segment, [])
      groupOrder.push(segment)
    }
    groups.get(segment)!.push(page)
  }

  const selected: T[] = home ? [home] : []
  let added = true
  while (selected.length < limit && added) {
    added = false
    for (const segment of groupOrder) {
      if (selected.length >= limit) break
      const next = groups.get(segment)!.shift()
      if (next) {
        selected.push(next)
        added = true
      }
    }
  }

  return selected.slice(0, limit)
}
