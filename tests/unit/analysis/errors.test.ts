import { describe, it, expect } from 'vitest'
import { humanizeAnalysisError } from '@/lib/analysis/errors'

describe('humanizeAnalysisError', () => {
  it('traduit un timeout en message actionnable', () => {
    const msg = humanizeAnalysisError('fetch failed: ETIMEDOUT after 30000ms')
    expect(msg).toContain('trop de temps à répondre')
    expect(msg).toContain('remboursés')
  })

  it('traduit une erreur de crawl', () => {
    const msg = humanizeAnalysisError('Firecrawl error: failed to scrape page')
    expect(msg).toContain('Impossible de lire le contenu')
  })

  it('traduit un rate limit des moteurs IA', () => {
    const msg = humanizeAnalysisError('OpenRouter returned 429 Too Many Requests')
    expect(msg).toContain('momentanément saturés')
  })

  it('traduit un refus d’accès (403)', () => {
    const msg = humanizeAnalysisError('Request failed with status 403 Forbidden')
    expect(msg).toContain('refusé l\'accès')
  })

  it('a un fallback générique avec rappel de remboursement', () => {
    const msg = humanizeAnalysisError('Something exotic exploded')
    expect(msg).toContain('incident technique')
    expect(msg).toContain('remboursés')
  })

  it('reste pur et déterministe', () => {
    expect(humanizeAnalysisError('ETIMEDOUT')).toBe(humanizeAnalysisError('ETIMEDOUT'))
  })
})
