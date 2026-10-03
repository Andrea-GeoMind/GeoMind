import { describe, it, expect, vi } from 'vitest'

// `lib/db/client` ouvre une connexion au chargement : on le remplace.
const execute = vi.fn()
vi.mock('@/lib/db/client', () => ({ db: { execute: (...a: unknown[]) => execute(...a) } }))

import { probeDatabase, SLOW_QUERY_MS } from '@/lib/db/health'

/**
 * Régression du 2026-10-03 : le healthcheck quotidien ne touchait pas la base,
 * donc Supabase ne voyait aucune activité et a mis le projet en pause après
 * sept jours. Le site est resté debout en apparence — pages publiques rendues
 * statiquement — pendant que connexion, tableau de bord et audit gratuit
 * tombaient.
 */
describe('sonde de la base', () => {
  it('rapporte un aller-retour réussi', async () => {
    execute.mockResolvedValueOnce([{ ok: 1 }])
    const health = await probeDatabase()
    expect(health.ok).toBe(true)
    expect(health.error).toBeUndefined()
    expect(typeof health.durationMs).toBe('number')
  })

  it('exécute bien une requête — c’est elle qui compte comme activité', async () => {
    execute.mockResolvedValueOnce([{ ok: 1 }])
    await probeDatabase()
    expect(execute).toHaveBeenCalled()
  })

  it('rapporte l’échec sans lever', async () => {
    execute.mockRejectedValueOnce(new Error('ENOTFOUND projet.supabase.co'))
    const health = await probeDatabase()
    expect(health.ok).toBe(false)
    expect(health.error).toContain('ENOTFOUND')
  })

  it('garde un seuil de lenteur exploitable', () => {
    // Une base qui met plus de 5 s à répondre à `select 1` rend l'app inutilisable.
    expect(SLOW_QUERY_MS).toBeGreaterThan(1_000)
    expect(SLOW_QUERY_MS).toBeLessThanOrEqual(10_000)
  })
})
