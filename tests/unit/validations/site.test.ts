import { describe, it, expect } from 'vitest'
import { siteSchema, onboardingSiteSchema } from '@/lib/validations/site'

describe('siteSchema', () => {
  it('accepts valid name + url', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'https://exemple.fr' }).success).toBe(true)
  })
})

describe('onboardingSiteSchema', () => {
  it('accepts valid full payload', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fr',
      country: 'FR',
    })
    expect(result.success).toBe(true)
  })

  it('rejects language longer than 2 chars', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fre',
      country: 'FR',
    })
    expect(result.success).toBe(false)
  })

  it('rejects country longer than 2 chars', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fr',
      country: 'FRA',
    })
    expect(result.success).toBe(false)
  })

  it('defaults language to fr and country to FR when omitted', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe('fr')
      expect(result.data.country).toBe('FR')
    }
  })
})
