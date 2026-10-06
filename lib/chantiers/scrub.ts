/**
 * Le lien secret ne doit apparaître dans aucun outil tiers. Le navigateur du
 * client ne le voit qu'un instant (la route /chantier/[token] le place dans un
 * cookie puis redirige), mais la requête serveur, elle, passe par Sentry
 * (traces, erreurs). Ce masque s'applique à tout événement avant envoi.
 */

const TOKEN_IN_PATH = /\/chantier\/[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g

export function scrubChantierToken(text: string): string {
  return text.replace(TOKEN_IN_PATH, '/chantier/[token]')
}

/** Copie de l'événement, lien masqué partout (URL, transaction, fil d'Ariane…). */
export function scrubChantierTokens<T>(event: T): T {
  const json = JSON.stringify(event)
  if (json === undefined || !TOKEN_IN_PATH.test(json)) return event
  TOKEN_IN_PATH.lastIndex = 0
  return JSON.parse(scrubChantierToken(json)) as T
}
