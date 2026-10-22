import { describe, it, expect } from 'vitest'
import { checkHttpsMissing } from '@/lib/analysis/technical/rules/https-missing'

describe('checkHttpsMissing', () => {
  it('signale un site lu en http', async () => {
    const issue = await checkHttpsMissing({ siteUrl: 'http://x.fr/', pages: [{ url: 'http://x.fr/' }] })
    expect(issue?.ruleKey).toBe('https_missing')
  })

  it('se tait quand l’adresse http redirige vers https', async () => {
    expect(
      await checkHttpsMissing({ siteUrl: 'http://www.maison-gigi.fr/', pages: [{ url: 'https://www.maison-gigi.fr/' }] })
    ).toBeNull()
  })

  it('se tait pour une adresse déjà en https', async () => {
    expect(await checkHttpsMissing({ siteUrl: 'https://x.fr/', pages: [] })).toBeNull()
  })
})
