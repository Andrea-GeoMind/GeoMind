import { describe, it, expect, vi } from 'vitest'

const postgresSpy: ReturnType<typeof vi.fn> = vi.fn(() => ({}))
vi.mock('postgres', () => ({ default: postgresSpy }))
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn(() => ({})) }))
vi.mock('@/lib/env', () => ({ env: { DATABASE_URL: 'postgres://u:p@h:6543/db' } }))

/**
 * Régression : les valeurs par défaut de postgres-js (`max: 10`,
 * `idle_timeout: null`) retiennent les connexions indéfiniment. En serverless,
 * chaque instance tiède monopolise jusqu'à 10 connexions du pooler Supabase,
 * jusqu'à en épuiser le quota et faire échouer des requêtes au hasard.
 */
describe('client Drizzle — options de pool', () => {
  it('borne le pool et rend les connexions inactives', async () => {
    await import('@/lib/db/client')
    const opts = postgresSpy.mock.calls[0]?.[1] as unknown as Record<string, number | boolean>

    // PgBouncer en mode Transaction : pas de prepared statements.
    expect(opts.prepare).toBe(false)

    expect(opts.max).toBeLessThanOrEqual(5)
    expect(opts.idle_timeout).toBeGreaterThan(0)
    expect(opts.max_lifetime).toBeGreaterThan(0)
    // Plus court que le maxDuration de 30 s des routes qui interrogent la base.
    expect(opts.connect_timeout).toBeLessThan(30)
  })
})
