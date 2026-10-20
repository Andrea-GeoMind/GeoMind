import type { ProspectActivity } from '@/lib/prospect-audit/types'

/**
 * Secteur du relevé Places (C-05) → métier tel qu'un client le chercherait.
 * Le secteur « fitness » recouvre une salle et un coach : le nom tranche.
 */
export function activityForSector(sector: string, name: string): ProspectActivity {
  switch (sector) {
    case 'barbier':
      return 'barbier'
    case 'coiffeur':
      return 'coiffeur'
    case 'fitness':
      return /coach/i.test(name) ? 'coach sportif' : 'salle de sport'
    case 'yoga & pilates':
      return 'studio de yoga'
    case 'boxe & CrossFit':
      return 'salle de boxe'
    default:
      throw new Error(`Secteur inconnu : ${sector}`)
  }
}
