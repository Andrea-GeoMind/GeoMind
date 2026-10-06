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
})
