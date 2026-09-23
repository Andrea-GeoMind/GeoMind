/**
 * lib/analysis/site-summary.ts
 *
 * Résumé d'un site pour le tableau de bord. Pur et sans I/O, donc testable :
 * `site-card.tsx` importe l'action serveur de suppression, ce qui charge tout
 * l'environnement au premier import.
 */

export interface LatestAnalysisSummary {
  status: 'pending' | 'running' | 'success' | 'error'
  globalScore: number | null
  createdAt: Date
}

/**
 * État d'un site en une ligne.
 *
 * La carte n'affichait que le nom et l'URL : ni note, ni date, ni statut —
 * l'écran le moins informatif de l'application, pour un produit dont la
 * promesse est « sachez où vous en êtes ».
 */
export function analysisSummary(latest: LatestAnalysisSummary | null): string {
  if (!latest) return 'Jamais analysé'
  if (latest.status === 'pending' || latest.status === 'running') return 'Analyse en cours…'
  if (latest.status === 'error') return 'Dernière analyse en échec'

  const date = new Date(latest.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  // Une analyse réussie sans note globale existe : l'autorité peut ne pas avoir
  // été mesurée. Mieux vaut le dire que d'afficher « 0/100 ».
  if (latest.globalScore === null) return `Analysé le ${date}, score non disponible`
  return `Score ${latest.globalScore}/100 · analysé le ${date}`
}
