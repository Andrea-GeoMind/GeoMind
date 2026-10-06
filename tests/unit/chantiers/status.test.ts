import { describe, it, expect } from 'vitest'
import { chantierDisplayState } from '@/lib/chantiers/status'

const NOW = new Date('2026-10-06T12:00:00Z')
const base = {
  status: 'open' as const,
  tokenExpiresAt: new Date('2026-12-05T12:00:00Z'),
  tokenRevokedAt: null,
  submittedAt: null,
}

describe('chantierDisplayState', () => {
  it('brouillon', () => {
    expect(chantierDisplayState({ ...base, status: 'draft', tokenExpiresAt: null }, NOW).kind).toBe('draft')
  })

  it('en cours, avec la date d’expiration en français', () => {
    const s = chantierDisplayState(base, NOW)
    expect(s.kind).toBe('active')
    expect(s.label).toBe('En cours · lien valable jusqu’au 5 décembre 2026')
  })

  it('terminé par le client', () => {
    const s = chantierDisplayState({ ...base, status: 'submitted', submittedAt: NOW }, NOW)
    expect(s.kind).toBe('submitted')
    expect(s.label).toMatch(/^Terminé par le client/)
  })

  it('expiré, révoqué, clos', () => {
    expect(chantierDisplayState({ ...base, tokenExpiresAt: NOW }, NOW).kind).toBe('expired')
    expect(chantierDisplayState({ ...base, tokenRevokedAt: NOW }, NOW).kind).toBe('revoked')
    expect(chantierDisplayState({ ...base, status: 'closed' }, NOW).kind).toBe('closed')
  })
})
