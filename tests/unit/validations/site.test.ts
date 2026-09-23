import { describe, it, expect } from 'vitest'
import { siteSchema, onboardingSiteSchema } from '@/lib/validations/site'

describe('siteSchema', () => {
  it('accepts valid name + url', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'https://exemple.fr' }).success).toBe(true)
  })

  // Le formulaire exigeait https:// alors que l'audit express acceptait le
  // domaine nu : même produit, deux règles. Les deux passent désormais par
  // normalizePublicUrl.
  it('accepte un domaine nu, comme l’audit express', () => {
    const result = siteSchema.safeParse({ name: 'Mon site', url: 'exemple.fr' })
    expect(result.success).toBe(true)
    expect(result.success && result.data.url).toBe('https://exemple.fr/')
  })

  it('accepte www, un chemin et une requête, et normalise sur la racine https', () => {
    for (const input of [
      'www.exemple.fr',
      'http://exemple.fr',
      'https://www.exemple.fr/contact?x=1',
      '  exemple.fr  ',
    ]) {
      const result = siteSchema.safeParse({ name: 'Mon site', url: input })
      expect(result.success, input).toBe(true)
      expect(result.success && result.data.url, input).toMatch(/^https:\/\/(www\.)?exemple\.fr\/$/)
    }
  })

  it('rejette ce que la garde anti-SSRF interdit', () => {
    for (const input of [
      'localhost',
      'http://127.0.0.1',
      'http://192.168.1.1',
      'ftp://exemple.fr',
      'https://exemple.fr:8080',
      'intranet',
      '',
    ]) {
      expect(siteSchema.safeParse({ name: 'Mon site', url: input }).success, input).toBe(false)
    }
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
