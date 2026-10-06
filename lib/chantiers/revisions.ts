/**
 * Historique des modifications de l'espace client.
 *
 * L'enregistrement automatique sauvegarde un champ à chaque pause de frappe :
 * sans fusion, une phrase tapée produirait des dizaines de lignes. Les
 * saisies successives d'un même champ par la même personne sont donc fusionnées
 * tant qu'elles se suivent à moins de 10 minutes : la révision garde la
 * valeur d'avant la première saisie et prend la dernière valeur.
 */

export const REVISION_MERGE_WINDOW_MS = 10 * 60 * 1000

export type RevisionActor = 'client' | 'geomind'

export interface LastRevision {
  id: string
  actor: RevisionActor
  oldValue: unknown
  updatedAt: Date
}

export type RevisionPlan =
  | { action: 'skip' }
  | { action: 'insert'; oldValue: unknown; newValue: unknown }
  | { action: 'merge'; id: string; newValue: unknown }
  /** La rafale de saisies revient à la valeur de départ : la révision n'a plus lieu d'être */
  | { action: 'discard'; id: string }

/** JSON aux clés triées : deux objets égaux donnent la même chaîne. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
}

export function sameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

/**
 * @param last dernière révision de ce champ (même chantier, établissement, clé)
 * @param previousValue valeur enregistrée avant cette saisie (undefined si aucune)
 */
export function planRevision(params: {
  last: LastRevision | null
  actor: RevisionActor
  previousValue: unknown
  nextValue: unknown
  now: Date
}): RevisionPlan {
  const { last, actor, previousValue, nextValue, now } = params
  if (sameValue(previousValue, nextValue)) return { action: 'skip' }

  const mergeable =
    last !== null &&
    last.actor === actor &&
    now.getTime() - last.updatedAt.getTime() < REVISION_MERGE_WINDOW_MS

  if (mergeable) {
    if (sameValue(last.oldValue, nextValue)) return { action: 'discard', id: last.id }
    return { action: 'merge', id: last.id, newValue: nextValue }
  }
  return { action: 'insert', oldValue: previousValue ?? null, newValue: nextValue }
}
