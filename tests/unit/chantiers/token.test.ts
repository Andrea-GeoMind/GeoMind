import { describe, it, expect } from 'vitest'
import {
  generateChantierToken,
  hashChantierToken,
  isWellFormedToken,
  tokenExpiryFrom,
  tokenState,
  TOKEN_TTL_DAYS,
  type TokenHolder,
} from '@/lib/chantiers/token'

const NOW = new Date('2026-10-06T12:00:00Z')
const open = (overrides: Partial<TokenHolder> = {}): TokenHolder => ({
  status: 'open',
  tokenExpiresAt: new Date('2026-12-05T12:00:00Z'),
  tokenRevokedAt: null,
  ...overrides,
})

describe('generateChantierToken', () => {
  it('produit un lien de 43 caractères base64url (256 bits)', () => {
    const { token } = generateChantierToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(isWellFormedToken(token)).toBe(true)
  })

  it("renvoie l'empreinte SHA-256 du lien, jamais le lien lui-même", () => {
    const { token, hash } = generateChantierToken()
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(hashChantierToken(token))
    expect(hash).not.toContain(token)
  })

  it('ne produit jamais deux fois le même lien', () => {
    const tokens = new Set(Array.from({ length: 500 }, () => generateChantierToken().token))
    expect(tokens.size).toBe(500)
  })
})

describe('isWellFormedToken', () => {
  it.each([
    ['', false],
    ['abc', false],
    ['a'.repeat(42), false],
    ['a'.repeat(44), false],
    ['a'.repeat(42) + '/', false],
    ['a'.repeat(42) + '=', false],
    ['../' + 'a'.repeat(40), false],
    ['A-_z09' + 'x'.repeat(37), true],
  ])('%s → %s', (token, expected) => {
    expect(isWellFormedToken(token)).toBe(expected)
  })
})

describe('tokenExpiryFrom', () => {
  it(`expire ${TOKEN_TTL_DAYS} jours après l'émission`, () => {
    expect(tokenExpiryFrom(NOW).toISOString()).toBe('2026-12-05T12:00:00.000Z')
  })
})

describe('tokenState', () => {
  it('lien valide', () => {
    expect(tokenState(open(), NOW)).toBe('valid')
  })

  it('chantier introuvable → unknown', () => {
    expect(tokenState(null, NOW)).toBe('unknown')
  })

  it('expiré à la seconde près', () => {
    expect(tokenState(open({ tokenExpiresAt: NOW }), NOW)).toBe('expired')
    expect(tokenState(open({ tokenExpiresAt: new Date(NOW.getTime() + 1000) }), NOW)).toBe('valid')
  })

  it('révoqué, même avant expiration', () => {
    expect(tokenState(open({ tokenRevokedAt: new Date('2026-10-01') }), NOW)).toBe('revoked')
  })

  it('fermé prime sur expiré et révoqué', () => {
    expect(
      tokenState(
        open({ status: 'closed', tokenExpiresAt: new Date('2026-01-01'), tokenRevokedAt: NOW }),
        NOW
      )
    ).toBe('closed')
  })

  it("un brouillon n'ouvre rien", () => {
    expect(tokenState(open({ status: 'draft' }), NOW)).toBe('unknown')
  })

  it('un chantier déclaré terminé reste modifiable', () => {
    expect(tokenState(open({ status: 'submitted' }), NOW)).toBe('valid')
  })
})
