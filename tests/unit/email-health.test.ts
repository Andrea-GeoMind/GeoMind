import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { RESEND_API_KEY: 'test-key', EMAIL_FROM: 'noreply@geomind.fr' },
}))

import { probeEmailDelivery } from '@/lib/email/health'

/**
 * Régression : la clé Resend de production est restée révoquée sans alerte,
 * `sendEmail` échouant volontairement en silence. La sonde doit rendre chacun
 * de ces cas visible.
 */
function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('probeEmailDelivery', () => {
  it('signale une clé refusée', async () => {
    mockFetch(401, { message: 'API key is invalid' })
    const h = await probeEmailDelivery()
    expect(h.ok).toBe(false)
    expect(h.error).toContain('401')
  })

  it('signale un domaine d’envoi absent du compte', async () => {
    mockFetch(200, { data: [{ name: 'autre-domaine.fr', status: 'verified' }] })
    const h = await probeEmailDelivery()
    expect(h.ok).toBe(false)
    expect(h.error).toContain('geomind.fr')
  })

  it('signale un domaine non vérifié', async () => {
    mockFetch(200, { data: [{ name: 'geomind.fr', status: 'pending' }] })
    const h = await probeEmailDelivery()
    expect(h.ok).toBe(false)
    expect(h.error).toContain('pending')
  })

  it('passe quand la clé est valide et le domaine vérifié', async () => {
    mockFetch(200, { data: [{ name: 'geomind.fr', status: 'verified' }] })
    const h = await probeEmailDelivery()
    expect(h).toEqual({ ok: true, domainVerified: true })
  })

  it('n’envoie aucun email — appel en lecture seule', async () => {
    mockFetch(200, { data: [{ name: 'geomind.fr', status: 'verified' }] })
    await probeEmailDelivery()
    const calls = vi.mocked(globalThis.fetch).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('https://api.resend.com/domains')
    expect(calls[0][1]?.method ?? 'GET').toBe('GET')
  })
})
