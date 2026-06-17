import { describe, it, expect } from 'vitest'
import {
  OFF_SITE_PLATFORMS,
  OFF_SITE_CATEGORY_LABELS,
  getOffSitePlatform,
  type OffSitePlatformCategory,
} from '@/lib/analysis/offsite-platforms'

const VALID_CATEGORIES: OffSitePlatformCategory[] = [
  'identite',
  'avis',
  'annuaire',
  'communaute',
  'encyclopedie',
]

describe('offsite-platforms registry', () => {
  it('contient des plateformes', () => {
    expect(OFF_SITE_PLATFORMS.length).toBeGreaterThanOrEqual(8)
  })

  it('a des ids uniques', () => {
    const ids = OFF_SITE_PLATFORMS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque plateforme est complète et valide', () => {
    for (const p of OFF_SITE_PLATFORMS) {
      expect(p.id).toMatch(/^[a-z0-9_]+$/)
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.domain).toMatch(/\./)
      expect(VALID_CATEGORIES).toContain(p.category)
      expect([1, 2, 3]).toContain(p.priority)
      expect(p.why.length).toBeGreaterThan(10)
      expect(p.steps.length).toBeGreaterThanOrEqual(2)
      expect(typeof p.selfServeFree).toBe('boolean')
    }
  })

  it('a au moins une plateforme incontournable (priorité 1)', () => {
    expect(OFF_SITE_PLATFORMS.some((p) => p.priority === 1)).toBe(true)
  })

  it('toutes les catégories utilisées ont un label', () => {
    for (const p of OFF_SITE_PLATFORMS) {
      expect(OFF_SITE_CATEGORY_LABELS[p.category]).toBeTruthy()
    }
  })

  it('getOffSitePlatform retrouve par id et renvoie undefined sinon', () => {
    expect(getOffSitePlatform(OFF_SITE_PLATFORMS[0].id)?.id).toBe(OFF_SITE_PLATFORMS[0].id)
    expect(getOffSitePlatform('inexistant-xyz')).toBeUndefined()
  })
})
