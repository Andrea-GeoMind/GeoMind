import { tokenState, type TokenHolder } from '@/lib/chantiers/token'

/**
 * État d'un chantier tel que l'affiche le tableau de bord GeoMind.
 * Pur : dépend seulement de la ligne et de l'heure.
 */

export type ChantierDisplayState =
  | { kind: 'draft'; label: string }
  | { kind: 'active'; label: string; expiresAt: Date }
  | { kind: 'submitted'; label: string; expiresAt: Date }
  | { kind: 'expired'; label: string }
  | { kind: 'revoked'; label: string }
  | { kind: 'closed'; label: string }

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export function formatChantierDate(date: Date): string {
  return DATE.format(date)
}

export function chantierDisplayState(
  chantier: TokenHolder & { submittedAt: Date | null },
  now: Date
): ChantierDisplayState {
  if (chantier.status === 'draft') return { kind: 'draft', label: 'Brouillon : lien pas encore émis' }

  const state = tokenState(chantier, now)
  switch (state) {
    case 'closed':
      return { kind: 'closed', label: 'Clos' }
    case 'revoked':
      return { kind: 'revoked', label: 'Lien révoqué' }
    case 'expired':
      return { kind: 'expired', label: 'Lien expiré' }
    case 'valid': {
      const expiresAt = chantier.tokenExpiresAt as Date
      const until = `lien valable jusqu’au ${formatChantierDate(expiresAt)}`
      return chantier.submittedAt
        ? { kind: 'submitted', label: `Terminé par le client · ${until}`, expiresAt }
        : { kind: 'active', label: `En cours · ${until}`, expiresAt }
    }
    case 'unknown':
      return { kind: 'revoked', label: 'Lien inutilisable' }
  }
}

const DATE_TIME = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
})

/** « 6 octobre 2026 à 20:20 », heure de Paris. */
export function formatChantierDateTime(date: Date): string {
  return DATE_TIME.format(date)
}
