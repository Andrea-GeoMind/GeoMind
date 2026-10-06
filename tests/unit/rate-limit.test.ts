import { describe, it, expect } from 'vitest'
import { rateLimitKey, rateLimitVerdict, windowStartFor } from '@/lib/rate-limit'
import { CHANTIER_RATE_LIMITS } from '@/lib/chantiers/rate-limits'

describe('windowStartFor', () => {
  it('aligne sur des fenêtres fixes', () => {
    const at = new Date('2026-10-06T12:07:31.500Z')
    expect(windowStartFor(at, 600).toISOString()).toBe('2026-10-06T12:00:00.000Z')
    expect(windowStartFor(at, 3600).toISOString()).toBe('2026-10-06T12:00:00.000Z')
    expect(windowStartFor(at, 60).toISOString()).toBe('2026-10-06T12:07:00.000Z')
  })

  it('deux instants de la même fenêtre partagent le compteur', () => {
    const a = windowStartFor(new Date('2026-10-06T12:00:00.000Z'), 600)
    const b = windowStartFor(new Date('2026-10-06T12:09:59.999Z'), 600)
    expect(a.getTime()).toBe(b.getTime())
  })
})

describe('rateLimitVerdict', () => {
  const rule = { limit: 10, windowSeconds: 3600 }
  const now = new Date('2026-10-06T12:15:00Z')

  it('autorise jusqu’à la limite incluse', () => {
    expect(rateLimitVerdict(10, rule, now).allowed).toBe(true)
    expect(rateLimitVerdict(11, rule, now).allowed).toBe(false)
  })

  it('indique le temps restant avant la fenêtre suivante', () => {
    expect(rateLimitVerdict(11, rule, now).retryAfterSeconds).toBe(45 * 60)
  })

  it('jamais moins d’une seconde', () => {
    expect(rateLimitVerdict(11, rule, new Date('2026-10-06T12:59:59.999Z')).retryAfterSeconds).toBe(1)
  })
})

describe('plafonds de l’espace chantier', () => {
  it('les faux liens sont bien plus limités que les pages vues', () => {
    const perHour = (r: { limit: number; windowSeconds: number }) => (r.limit * 3600) / r.windowSeconds
    expect(perHour(CHANTIER_RATE_LIMITS.badToken)).toBeLessThan(perHour(CHANTIER_RATE_LIMITS.view) / 10)
  })

  it('rateLimitKey', () => {
    expect(rateLimitKey('chantier', 'save', 'abc')).toBe('chantier:save:abc')
  })
})
