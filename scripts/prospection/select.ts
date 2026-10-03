import type { Business } from './types'

/**
 * Répartit la sélection entre catégories plutôt que de servir les premières.
 *
 * Le premier dry-run prenait les éligibles dans l'ordre de recherche : sur 30
 * retenues, 8 paysagistes et 7 électriciens en occupaient la moitié, et
 * menuisiers, carreleurs et déménageurs n'apparaissaient pas du tout. Un
 * échantillon déséquilibré ne dit rien de la qualité d'un métier.
 */
export function roundRobin(
  businesses: Business[],
  limit: number,
  options: { prioritizePlatforms?: boolean } = {}
): Business[] {
  // Les sites sans domaine propre passent devant : leur visibilité est
  // structurellement faible et le premier conseil à leur donner est évident.
  // Sans ce tri, ils dépendaient du hasard du tourniquet — un seul des deux
  // éligibles était ressorti au dry-run du 19/09.
  //
  // En mode léger, ce tri n'a plus de raison d'être : les emails ne parlent
  // plus du site. Il ne ferait que déséquilibrer la série.
  const prioritize = options.prioritizePlatforms ?? true
  const priority = prioritize ? businesses.filter((b) => b.platform) : []
  const rest = prioritize ? businesses.filter((b) => !b.platform) : [...businesses]

  const out: Business[] = priority.slice(0, limit)
  if (out.length >= limit) return out

  const byCategory = new Map<string, Business[]>()
  for (const b of rest) {
    const list = byCategory.get(b.category) ?? []
    list.push(b)
    byCategory.set(b.category, list)
  }

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
