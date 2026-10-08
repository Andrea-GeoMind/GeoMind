/**
 * Le lien secret ne doit apparaître dans aucun outil tiers. Le navigateur du
 * client ne le voit qu'un instant (la route /chantier/[token] le place dans un
 * cookie puis redirige), mais la requête serveur, elle, passe par Sentry
 * (traces, erreurs). Ce masque s'applique à tout événement avant envoi.
 *
 * Il retire aussi le corps et les cookies de toute requête vers /chantier :
 * ce que le client saisit (réponses, questions à l'assistant) et son cookie
 * d'accès ne partent jamais chez Sentry.
 */

const TOKEN_IN_PATH = /\/chantier\/[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g

export function scrubChantierToken(text: string): string {
  return text.replace(TOKEN_IN_PATH, '/chantier/[token]')
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Requête vers /chantier : ni corps, ni cookies, ni en-tête Cookie. */
function dropChantierRequestData<T>(event: T): T {
  if (!isRecord(event) || !isRecord(event.request)) return event
  const request = event.request
  if (typeof request.url !== 'string' || !/\/chantier(\/|$|\?)/.test(request.url)) return event
  const { data: _data, cookies: _cookies, ...rest } = request
  const headers = isRecord(rest.headers)
    ? Object.fromEntries(Object.entries(rest.headers).filter(([k]) => k.toLowerCase() !== 'cookie'))
    : rest.headers
  return { ...event, request: { ...rest, ...(headers === undefined ? {} : { headers }) } }
}

/** Copie de l'événement, lien masqué partout (URL, transaction, fil d'Ariane…). */
export function scrubChantierTokens<T>(event: T): T {
  const cleaned = dropChantierRequestData(event)
  const json = JSON.stringify(cleaned)
  if (json === undefined || !TOKEN_IN_PATH.test(json)) return cleaned
  TOKEN_IN_PATH.lastIndex = 0
  return JSON.parse(scrubChantierToken(json)) as T
}
