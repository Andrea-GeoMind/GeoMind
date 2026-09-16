import { describe, it, expect, vi, beforeEach } from 'vitest'

const verifyOtp = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { verifyOtp } })),
}))

import { GET } from '@/app/auth/confirm/route'
import type { NextRequest } from 'next/server'

/**
 * Régression : les liens de `generateLink` pointaient vers /auth/v1/verify,
 * qui renvoie les jetons dans le fragment de l'URL. Le fragment n'atteignant
 * jamais le serveur, /auth/callback échouait alors que l'authentification
 * avait réussi. Cette route vérifie le token_hash côté serveur.
 */
function req(qs: string) {
  return new Request(`https://geomind.fr/auth/confirm${qs}`) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  verifyOtp.mockResolvedValue({ error: null })
})

describe('GET /auth/confirm', () => {
  it('vérifie le jeton puis redirige vers `next`', async () => {
    const res = await GET(req('?token_hash=abc&type=signup&next=%2Fclaim%2Ftok-123'))
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'signup', token_hash: 'abc' })
    expect(res.headers.get('location')).toBe('https://geomind.fr/claim/tok-123')
  })

  it('accepte aussi le type magiclink — compte déjà existant', async () => {
    await GET(req('?token_hash=abc&type=magiclink&next=%2Fclaim%2Ftok'))
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'magiclink', token_hash: 'abc' })
  })

  it('renvoie sur le tableau de bord quand `next` est absent', async () => {
    const res = await GET(req('?token_hash=abc&type=magiclink'))
    expect(res.headers.get('location')).toBe('https://geomind.fr/dashboard')
  })

  it('refuse une redirection externe (open redirect)', async () => {
    const res = await GET(req('?token_hash=abc&type=magiclink&next=%2F%2Fevil.com'))
    expect(res.headers.get('location')).toBe('https://geomind.fr/dashboard')
  })

  it('refuse un type inconnu sans appeler verifyOtp', async () => {
    const res = await GET(req('?token_hash=abc&type=bidon&next=%2Fclaim%2Ftok'))
    expect(verifyOtp).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('https://geomind.fr/login?error=auth-callback')
  })

  it('refuse un token_hash manquant', async () => {
    const res = await GET(req('?type=magiclink'))
    expect(verifyOtp).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('https://geomind.fr/login?error=auth-callback')
  })

  it('renvoie sur la page de connexion quand le jeton est refusé', async () => {
    verifyOtp.mockResolvedValue({ error: { status: 403, message: 'expired' } })
    const res = await GET(req('?token_hash=abc&type=magiclink&next=%2Fclaim%2Ftok'))
    expect(res.headers.get('location')).toBe('https://geomind.fr/login?error=auth-callback')
  })
})
