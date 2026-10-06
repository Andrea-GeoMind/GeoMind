import { createHash, randomBytes } from 'crypto'

/**
 * Lien secret de l'espace client de chantier (/chantier/[token]).
 *
 * 32 octets aléatoires (256 bits) en base64url : 43 caractères, non devinables.
 * La base ne conserve que l'empreinte SHA-256 : une fuite de la table ne donne
 * accès à aucun espace. Contrepartie assumée : le lien n'est affiché qu'une
 * fois, à l'émission ; s'il est perdu, on le régénère.
 */

export const TOKEN_BYTES = 32
export const TOKEN_TTL_DAYS = 60

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export function generateChantierToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  return { token, hash: hashChantierToken(token) }
}

export function hashChantierToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Filtre de forme, avant toute requête en base. */
export function isWellFormedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}

export function tokenExpiryFrom(issuedAt: Date): Date {
  return new Date(issuedAt.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export type TokenState = 'valid' | 'unknown' | 'expired' | 'revoked' | 'closed'

export interface TokenHolder {
  status: 'draft' | 'open' | 'submitted' | 'closed'
  tokenExpiresAt: Date | null
  tokenRevokedAt: Date | null
}

/**
 * État d'accès d'un lien, une fois le chantier retrouvé par l'empreinte.
 * L'ordre compte : un chantier fermé reste « fermé » même si son lien a expiré
 * entre-temps, pour que le message affiché au client soit le bon.
 */
export function tokenState(chantier: TokenHolder | null, now: Date): TokenState {
  if (!chantier) return 'unknown'
  if (chantier.status === 'closed') return 'closed'
  if (chantier.tokenRevokedAt) return 'revoked'
  // Un brouillon n'a pas encore de lien émis : rien ne doit l'ouvrir
  if (chantier.status === 'draft' || !chantier.tokenExpiresAt) return 'unknown'
  if (chantier.tokenExpiresAt.getTime() <= now.getTime()) return 'expired'
  return 'valid'
}
