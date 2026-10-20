import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { consumeRateLimit, peekRateLimit } from '@/lib/db/queries/rate-limits'
import { rateLimitKey, type RateLimitRule } from '@/lib/rate-limit'
import { clientIpFromHeaders, truncateIp } from '@/lib/chantiers/ip'
import { captureJobFailure } from '@/lib/monitoring'
import { loadAuditDocument } from '@/lib/prospect-audit/storage'
import { hashAuditToken, isAuditExpired, isWellFormedAuditToken } from '@/lib/prospect-audit/token'
import type { AuditDocument } from '@/lib/prospect-audit/types'

/**
 * Ouverture d'un audit prospect par son lien, sans compte.
 *
 * Inconnu, expiré ou trop d'essais : la page répond 404, sans dire lequel —
 * un lien qui n'ouvre rien ne doit rien apprendre à celui qui l'essaie.
 */

export const AUDIT_RATE_LIMITS = {
  /** Liens mal formés ou inconnus, par IP tronquée. */
  badToken: { limit: 20, windowSeconds: 60 * 60 },
  /** Pages vues (page et feuille A4), par IP tronquée. */
  view: { limit: 120, windowSeconds: 10 * 60 },
} as const satisfies Record<string, RateLimitRule>

/**
 * Le compteur vit en base : si elle ne répond pas, la page reste ouverte (le
 * contenu est public et le lien a 256 bits d'aléa), et l'incident remonte.
 */
const RATE_LIMIT_TIMEOUT_MS = 2_500

async function guarded<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('limite de débit : base injoignable')), RATE_LIMIT_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    captureJobFailure('prospect-audit-rate-limit', err)
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

const ALLOWED = { allowed: true, count: 0, retryAfterSeconds: 0 }

export type AuditAccess =
  | { ok: true; document: AuditDocument }
  | { ok: false; reason: 'malformed' | 'unknown' | 'expired' | 'rate_limited' }

/** Mis en cache le temps d'une requête : la page et ses métadonnées ne comptent qu'une vue. */
export const openAudit = cache(async (token: string): Promise<AuditAccess> => {
  const ip = truncateIp(clientIpFromHeaders(await headers()))
  const badKey = rateLimitKey('audit', 'badtoken', ip)

  if (!(await guarded(peekRateLimit(badKey, AUDIT_RATE_LIMITS.badToken), ALLOWED)).allowed) {
    return { ok: false, reason: 'rate_limited' }
  }
  const view = await guarded(consumeRateLimit(rateLimitKey('audit', 'view', ip), AUDIT_RATE_LIMITS.view), ALLOWED)
  if (!view.allowed) return { ok: false, reason: 'rate_limited' }

  if (!isWellFormedAuditToken(token)) {
    await guarded(consumeRateLimit(badKey, AUDIT_RATE_LIMITS.badToken), ALLOWED)
    return { ok: false, reason: 'malformed' }
  }

  const document = await loadAuditDocument(hashAuditToken(token))
  if (!document) {
    await guarded(consumeRateLimit(badKey, AUDIT_RATE_LIMITS.badToken), ALLOWED)
    return { ok: false, reason: 'unknown' }
  }
  if (isAuditExpired(document.expiresAt, new Date())) return { ok: false, reason: 'expired' }
  return { ok: true, document }
})
