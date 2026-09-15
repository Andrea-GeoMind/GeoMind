import { describe, it, expect } from 'vitest'
import { detectCity, buildLocalPrompts, buildLocalChecklist, stripCityFromActivity } from '@/lib/analysis/local'

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

// ─── Français correct dans les questions locales (QA 15/09) ──────────────────
// Les mots-clés de découverte contiennent souvent la ville ; le gabarit
// produisait « chirurgien-dentiste Lyon à Lyon » et « chirurgien-dentiste Lyons ».

describe('stripCityFromActivity', () => {
  it('retire la ville quand le mot-clé la contient déjà', () => {
    expect(stripCityFromActivity('chirurgien-dentiste Lyon', 'Lyon')).toBe('chirurgien-dentiste')
    expect(stripCityFromActivity('plombier à Marseille', 'Marseille')).toBe('plombier')
    expect(stripCityFromActivity('boulangerie de Nantes', 'Nantes')).toBe('boulangerie')
  })

  it('ignore la casse et les villes composées', () => {
    expect(stripCityFromActivity('notaire aix-en-provence', 'Aix-en-Provence')).toBe('notaire')
    expect(stripCityFromActivity('avocat CLERMONT-FERRAND', 'Clermont-Ferrand')).toBe('avocat')
  })

  it('laisse l’activité intacte quand la ville n’y est pas', () => {
    expect(stripCityFromActivity('chirurgien-dentiste', 'Lyon')).toBe('chirurgien-dentiste')
    expect(stripCityFromActivity('plombier', null)).toBe('plombier')
  })

  it('ne vide jamais l’activité', () => {
    expect(stripCityFromActivity('Lyon', 'Lyon')).toBe('Lyon')
  })
})

describe('buildLocalPrompts — qualité du français', () => {
  const prompts = buildLocalPrompts({
    activity: 'chirurgien-dentiste Lyon',
    city: 'Lyon',
    siteName: 'Cabinet Dr Venet',
  })

  it('ne répète jamais la ville', () => {
    for (const p of prompts) {
      expect(p.match(/Lyon/g)?.length ?? 0).toBeLessThanOrEqual(1)
    }
  })

  it('ne pluralise jamais l’activité', () => {
    for (const p of prompts) {
      expect(p).not.toContain('dentiste Lyons')
      expect(p).not.toContain('dentistes ')
    }
  })

  it('produit bien 5 questions géolocalisées', () => {
    expect(prompts).toHaveLength(5)
    for (const p of prompts) expect(p).toContain('Lyon')
  })
})
