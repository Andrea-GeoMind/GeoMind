import { describe, it, expect, vi, beforeEach } from 'vitest'

const MAX = 3
vi.mock('@/lib/env', () => ({
  env: { MONITORING_PAUSED: false, MONITORING_MAX_SITES_PER_RUN: MAX },
}))

const getLastCheckedAtBySite = vi.fn()
vi.mock('@/lib/db/queries/citation-checks', () => ({ getLastCheckedAtBySite }))
vi.mock('@/lib/db/client', () => ({ db: { select: vi.fn() } }))
vi.mock('@/lib/inngest/client', () => ({ inngest: { createFunction: vi.fn(() => ({})) } }))
vi.mock('@/lib/analysis/monitoring', () => ({ runMonitoringCheck: vi.fn() }))
vi.mock('@/lib/analysis/alerts', () => ({ evaluateMonitoringAlerts: vi.fn() }))

/**
 * Un cron fan-out un événement par site. Sans plafond, le coût d'un passage
 * croît linéairement avec la base et part en une seule salve — d'où le besoin
 * de borner, en servant d'abord les sites relevés il y a le plus longtemps.
 */
const { takeStalestSites } = (await import('@/lib/inngest/functions/monitor-sites')) as unknown as {
  takeStalestSites: (ids: string[]) => Promise<string[]>
}

const jour = (n: number) => new Date(2026, 0, n)

beforeEach(() => vi.clearAllMocks())

describe('takeStalestSites', () => {
  it('ne touche à rien en dessous du plafond', async () => {
    const r = await takeStalestSites(['a', 'b'])
    expect(r).toEqual(['a', 'b'])
    expect(getLastCheckedAtBySite).not.toHaveBeenCalled()
  })

  it('garde les sites relevés le plus anciennement', async () => {
    getLastCheckedAtBySite.mockResolvedValue(
      new Map([
        ['recent', jour(20)],
        ['moyen', jour(10)],
        ['vieux', jour(2)],
        ['tresvieux', jour(1)],
      ])
    )
    const r = await takeStalestSites(['recent', 'moyen', 'vieux', 'tresvieux'])
    expect(r).toEqual(['tresvieux', 'vieux', 'moyen'])
    expect(r).not.toContain('recent')
  })

  it('fait passer en tête un site jamais relevé', async () => {
    getLastCheckedAtBySite.mockResolvedValue(
      new Map([
        ['a', jour(5)],
        ['b', jour(6)],
        ['c', jour(7)],
        ['d', jour(8)],
      ])
    )
    const r = await takeStalestSites(['a', 'b', 'c', 'd', 'jamais'])
    expect(r[0]).toBe('jamais')
    expect(r).toHaveLength(MAX)
  })

  it('fait tourner la file : les servis deviennent les plus récents', async () => {
    // 5 sites, plafond 3 : le passage suivant doit servir les 2 laissés.
    getLastCheckedAtBySite.mockResolvedValue(
      new Map([
        ['s1', jour(1)],
        ['s2', jour(2)],
        ['s3', jour(3)],
        ['s4', jour(4)],
        ['s5', jour(5)],
      ])
    )
    const passage1 = await takeStalestSites(['s1', 's2', 's3', 's4', 's5'])
    expect(passage1).toEqual(['s1', 's2', 's3'])

    // Après relevé, s1..s3 sont les plus récents.
    getLastCheckedAtBySite.mockResolvedValue(
      new Map([
        ['s1', jour(30)],
        ['s2', jour(30)],
        ['s3', jour(30)],
        ['s4', jour(4)],
        ['s5', jour(5)],
      ])
    )
    const passage2 = await takeStalestSites(['s1', 's2', 's3', 's4', 's5'])
    expect(passage2.slice(0, 2)).toEqual(['s4', 's5'])
  })
})
