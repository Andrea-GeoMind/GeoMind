import { createHash, randomBytes } from 'crypto'

/**
 * Lien secret d'un audit prospect (/audit/[token]).
 *
 * Même construction que le lien d'espace chantier (lib/chantiers/token.ts) :
 * 32 octets aléatoires en base64url, 43 caractères, non devinables. Le
 * stockage ne connaît que l'empreinte SHA-256 : qui lit le bucket ne peut pas
 * en déduire l'adresse d'un audit. Le lien n'existe en clair que sur la
 * feuille imprimée et dans le relevé local de l'admin.
 */

const TOKEN_BYTES = 32
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export function generateAuditToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  return { token, hash: hashAuditToken(token) }
}

export function hashAuditToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Filtre de forme, avant toute lecture du stockage. */
export function isWellFormedAuditToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}

export function isAuditExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() <= now.getTime()
}
