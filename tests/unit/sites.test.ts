import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, PLAN_UPGRADE_URLS } from '@/lib/plans'
import { siteSchema } from '@/lib/validations/site'

describe('PLAN_LIMITS', () => {
  it('Free plan limite à 1 site', () => {
    expect(PLAN_LIMITS.free.sites).toBe(1)
  })

  it('Pro plan limite à 5 sites', () => {
    expect(PLAN_LIMITS.pro.sites).toBe(5)
  })

  it('Business plan limite à 10 sites', () => {
    expect(PLAN_LIMITS.business.sites).toBe(10)
  })

  it('Free plan a un URL de passage supérieur', () => {
    expect(PLAN_UPGRADE_URLS.free).toBe('/pricing')
  })

  it("Business plan n'a pas de upgrade URL", () => {
    expect(PLAN_UPGRADE_URLS.business).toBeNull()
  })
})

describe('siteSchema — validation URL', () => {
  it('accepte une URL https valide', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'https://exemple.fr' }).success).toBe(
      true
    )
  })

  it('accepte une URL http valide', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'http://exemple.fr' }).success).toBe(true)
  })

  it('rejette une URL sans protocole', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'exemple.fr' }).success).toBe(false)
  })

  it('rejette un protocole non http(s)', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'ftp://exemple.fr' }).success).toBe(false)
  })

  it('rejette une URL vide', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: '' }).success).toBe(false)
  })

  it('rejette un nom vide', () => {
    expect(siteSchema.safeParse({ name: '', url: 'https://exemple.fr' }).success).toBe(false)
  })

  it('rejette un nom trop long (> 100 car.)', () => {
    const longName = 'a'.repeat(101)
    expect(siteSchema.safeParse({ name: longName, url: 'https://exemple.fr' }).success).toBe(false)
  })
})
