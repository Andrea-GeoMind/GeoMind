/**
 * Limitation de débit par fenêtre fixe, adossée à la table rate_limits
 * (lib/db/queries/rate-limits.ts). Un compteur en mémoire ne tiendrait pas en
 * serverless : chaque instance Vercel aurait le sien.
 *
 * Ce module ne contient que la partie pure (fenêtres, verdict), testable sans base.
 */

export interface RateLimitRule {
  limit: number
  windowSeconds: number
}

export interface RateLimitVerdict {
  allowed: boolean
  count: number
  /** Secondes avant l'ouverture de la fenêtre suivante */
  retryAfterSeconds: number
}

/** Début de la fenêtre qui contient `now` (alignée sur l'époque Unix). */
export function windowStartFor(now: Date, windowSeconds: number): Date {
  const size = windowSeconds * 1000
  return new Date(Math.floor(now.getTime() / size) * size)
}

export function rateLimitVerdict(count: number, rule: RateLimitRule, now: Date): RateLimitVerdict {
  const end = windowStartFor(now, rule.windowSeconds).getTime() + rule.windowSeconds * 1000
  return {
    allowed: count <= rule.limit,
    count,
    retryAfterSeconds: Math.max(1, Math.ceil((end - now.getTime()) / 1000)),
  }
}

export function rateLimitKey(...parts: string[]): string {
  return parts.join(':')
}
