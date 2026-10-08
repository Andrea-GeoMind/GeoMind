import { describe, it, expect } from 'vitest'
import { scrubChantierToken, scrubChantierTokens } from '@/lib/chantiers/scrub'
import { generateChantierToken } from '@/lib/chantiers/token'

describe('masquage du lien secret', () => {
  const { token } = generateChantierToken()

  it('remplace le lien dans une URL', () => {
    expect(scrubChantierToken(`https://geomind.fr/chantier/${token}?a=1`)).toBe(
      'https://geomind.fr/chantier/[token]?a=1'
    )
  })

  it('laisse intactes les pages sans lien', () => {
    for (const path of ['/chantier/espace', '/chantier/statut?raison=expired', '/dashboard/chantiers']) {
      expect(scrubChantierToken(path)).toBe(path)
    }
  })

  it('nettoie tout un événement Sentry, à toute profondeur', () => {
    const event = {
      request: { url: `https://geomind.fr/chantier/${token}` },
      transaction: `GET /chantier/${token}`,
      breadcrumbs: [{ data: { to: `/chantier/${token}`, from: '/' } }],
    }
    const clean = scrubChantierTokens(event)
    expect(JSON.stringify(clean)).not.toContain(token)
    expect(clean.transaction).toBe('GET /chantier/[token]')
    expect(scrubChantierTokens(event)).not.toBe(event)
  })

  it('renvoie l’événement tel quel s’il n’y a rien à masquer', () => {
    const event = { request: { url: 'https://geomind.fr/' } }
    expect(scrubChantierTokens(event)).toBe(event)
    expect(scrubChantierTokens(null)).toBeNull()
  })

  it('retire le corps et les cookies des requêtes vers /chantier (questions, réponses)', () => {
    const event = {
      request: {
        url: 'https://geomind.fr/chantier/assistant',
        data: '{"question":"mon mot de passe est secret123"}',
        cookies: { geomind_chantier: token },
        headers: { Cookie: `geomind_chantier=${token}`, 'User-Agent': 'x' },
      },
    }
    const clean = scrubChantierTokens(event)
    expect(JSON.stringify(clean)).not.toContain('secret123')
    expect(JSON.stringify(clean)).not.toContain(token)
    expect(clean.request.headers).toEqual({ 'User-Agent': 'x' })
    // Ailleurs, rien ne change
    const other = { request: { url: 'https://geomind.fr/dashboard', data: 'x' } }
    expect(scrubChantierTokens(other)).toBe(other)
  })
})
