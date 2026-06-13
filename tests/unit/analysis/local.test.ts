import { describe, it, expect } from 'vitest'
import { detectCity, buildLocalPrompts, buildLocalChecklist } from '@/lib/analysis/local'

describe('detectCity', () => {
  it('détecte une ville depuis « à <Ville> »', () => {
    expect(detectCity(['Boulangerie artisanale à Lyon, pains au levain.'])).toBe('Lyon')
  })

  it('détecte une grande ville mentionnée telle quelle', () => {
    expect(detectCity(['plombier', 'dépannage marseille 24h'])).toBe('Marseille')
  })

  it('gère les villes composées', () => {
    expect(detectCity(['expert-comptable à Aix-en-Provence'])).toBe('Aix-En-Provence')
  })

  it('retourne null si aucune ville fiable', () => {
    expect(detectCity(['conseil en stratégie digitale'])).toBeNull()
    expect(detectCity([])).toBeNull()
  })
})

describe('buildLocalPrompts', () => {
  it('intègre activité et ville', () => {
    const prompts = buildLocalPrompts({ activity: 'plombier', city: 'Lyon', siteName: 'X' })
    expect(prompts).toHaveLength(5)
    expect(prompts[0]).toContain('plombier')
    expect(prompts[0]).toContain('Lyon')
  })

  it('utilise un placeholder si la ville est inconnue', () => {
    const prompts = buildLocalPrompts({ activity: 'coiffeur', city: null, siteName: 'X' })
    expect(prompts.every((p) => p.includes('[votre ville]'))).toBe(true)
  })
})

describe('buildLocalChecklist', () => {
  it('produit la checklist personnalisée avec le nom et la ville', () => {
    const list = buildLocalChecklist({ activity: 'fleuriste', city: 'Nantes', siteName: 'Flora' })
    expect(list.length).toBeGreaterThanOrEqual(5)
    expect(list.some((i) => i.key === 'google-business')).toBe(true)
    expect(list.some((i) => i.action.includes('Flora'))).toBe(true)
    expect(list.some((i) => i.action.includes('Nantes'))).toBe(true)
  })
})
