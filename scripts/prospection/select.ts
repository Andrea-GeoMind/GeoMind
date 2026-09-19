import type { Business } from './types'

/**
 * Répartit la sélection entre catégories plutôt que de servir les premières.
 *
 * Le premier dry-run prenait les éligibles dans l'ordre de recherche : sur 30
 * retenues, 8 paysagistes et 7 électriciens en occupaient la moitié, et
 * menuisiers, carreleurs et déménageurs n'apparaissaient pas du tout. Un
 * échantillon déséquilibré ne dit rien de la qualité d'un métier.
 */
export function roundRobin(businesses: Business[], limit: number): Business[] {
  const byCategory = new Map<string, Business[]>()
  for (const b of businesses) {
    const list = byCategory.get(b.category) ?? []
    list.push(b)
    byCategory.set(b.category, list)
  }

  const out: Business[] = []
  let exhausted = false
  while (out.length < limit && !exhausted) {
    exhausted = true
    for (const list of byCategory.values()) {
      if (out.length >= limit) break
      const next = list.shift()
      if (next) {
        out.push(next)
        exhausted = false
      }
    }
  }
  return out
}
