import { describe, it, expect } from 'vitest'
import { normalizePublicUrl, robotsBlocksAiBots } from '@/lib/analysis/express-audit'

describe('normalizePublicUrl (anti-SSRF)', () => {
  it('normalise un domaine nu en https racine', () => {
    expect(normalizePublicUrl('exemple.fr')?.href).toBe('https://exemple.fr/')
    expect(normalizePublicUrl('https://www.exemple.fr/page?x=1')?.href).toBe(
      'https://www.exemple.fr/'
    )
  })

  it('rejette localhost et les hôtes sans TLD', () => {
    expect(normalizePublicUrl('localhost')).toBeNull()
    expect(normalizePublicUrl('http://localhost:3000')).toBeNull()
    expect(normalizePublicUrl('intranet')).toBeNull()
  })

  it('rejette les IP littérales et plages privées', () => {
    expect(normalizePublicUrl('127.0.0.1')).toBeNull()
    expect(normalizePublicUrl('http://10.0.0.5')).toBeNull()
    expect(normalizePublicUrl('http://192.168.1.1')).toBeNull()
    expect(normalizePublicUrl('http://172.20.3.4')).toBeNull()
    expect(normalizePublicUrl('http://169.254.169.254')).toBeNull() // metadata cloud
    expect(normalizePublicUrl('http://8.8.8.8')).toBeNull() // IP publique aussi : domaine requis
  })

  it('rejette les schémas et ports exotiques', () => {
    expect(normalizePublicUrl('ftp://exemple.fr')).toBeNull()
    expect(normalizePublicUrl('https://exemple.fr:8080')).toBeNull()
    expect(normalizePublicUrl('https://user:pass@exemple.fr')).toBeNull()
  })

  it('rejette les entrées vides ou démesurées', () => {
    expect(normalizePublicUrl('')).toBeNull()
    expect(normalizePublicUrl('a'.repeat(3000))).toBeNull()
  })
})

describe('robotsBlocksAiBots', () => {
  it('détecte un blocage explicite de GPTBot', () => {
    expect(robotsBlocksAiBots('User-agent: GPTBot\nDisallow: /')).toBe(true)
  })

  it('détecte un blocage global (*)', () => {
    expect(robotsBlocksAiBots('User-agent: *\nDisallow: /')).toBe(true)
  })

  it('ne signale pas un robots.txt ouvert', () => {
    expect(robotsBlocksAiBots('User-agent: *\nDisallow:')).toBe(false)
    expect(robotsBlocksAiBots('User-agent: *\nDisallow: /admin/')).toBe(false)
  })

  it('ne signale pas le blocage d’un bot non-IA', () => {
    expect(robotsBlocksAiBots('User-agent: BadBot\nDisallow: /')).toBe(false)
  })

  it('gère plusieurs groupes', () => {
    const txt = 'User-agent: *\nDisallow: /admin/\n\nUser-agent: ClaudeBot\nDisallow: /'
    expect(robotsBlocksAiBots(txt)).toBe(true)
  })
})
