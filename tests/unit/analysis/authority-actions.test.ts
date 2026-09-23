import { describe, it, expect } from 'vitest'
import { buildAuthorityActions, LOW_AUTHORITY_THRESHOLD } from '@/lib/analysis/authority-actions'

describe('buildAuthorityActions', () => {
  it('propose des actions quand l’autorité est à 0 — le cas rapporté', () => {
    const actions = buildAuthorityActions({ authorityScore: 0 })
    expect(actions.length).toBeGreaterThanOrEqual(3)
    expect(actions.length).toBeLessThanOrEqual(4)
  })

  it('reste muet quand l’autorité est bonne', () => {
    expect(buildAuthorityActions({ authorityScore: LOW_AUTHORITY_THRESHOLD })).toEqual([])
    expect(buildAuthorityActions({ authorityScore: 85 })).toEqual([])
  })

  it('reste muet quand l’autorité n’a pas été mesurée', () => {
    expect(buildAuthorityActions({ authorityScore: null })).toEqual([])
  })

  it('couvre les quatre leviers demandés', () => {
    const keys = buildAuthorityActions({ authorityScore: 10 }).map((a) => a.ruleKey)
    expect(keys).toEqual([
      'authority_google_business_profile',
      'authority_directories',
      'authority_service_pages',
      'authority_third_party_mentions',
    ])
  })

  it('nomme la catégorie Google et les avis dans la première action', () => {
    const [first] = buildAuthorityActions({ authorityScore: 10 })
    expect(first.description).toMatch(/catégorie/i)
    expect(first.description).toMatch(/avis/i)
  })

  it('cite des annuaires sectoriels concrets', () => {
    const directories = buildAuthorityActions({ authorityScore: 10 })[1]
    expect(directories.description).toContain('Pages Jaunes')
    expect(directories.description).toMatch(/Houzz|Doctolib|mariages\.net|Batup/)
  })

  it('reprend les plateformes détectées comme absentes', () => {
    const actions = buildAuthorityActions({
      authorityScore: 10,
      absentPlatformNames: ['LinkedIn', 'Wikidata'],
    })
    expect(actions[1].description).toContain('LinkedIn')
    expect(actions[1].description).toContain('Wikidata')
  })

  it('ne mentionne aucune absence quand la détection n’a rien remonté', () => {
    const actions = buildAuthorityActions({ authorityScore: 10, absentPlatformNames: [] })
    expect(actions[1].description).not.toMatch(/absent de/i)
  })

  // Règle éditoriale : on décrit ce que font les moteurs de ces signaux, jamais
  // le résultat obtenu — il ne dépend pas de nous.
  it('ne promet jamais d’être cité', () => {
    const actions = buildAuthorityActions({ authorityScore: 0 })
    for (const a of actions) {
      const text = `${a.title} ${a.description}`.toLowerCase()
      expect(text, a.ruleKey).not.toMatch(/vous serez cité|garantit|assure votre citation/)
      expect(text, a.ruleKey).not.toMatch(/vous fera citer|permettra d'être cité/)
    }
  })

  it('est déterministe — même entrée, même sortie', () => {
    const a = buildAuthorityActions({ authorityScore: 12, absentPlatformNames: ['X'] })
    const b = buildAuthorityActions({ authorityScore: 12, absentPlatformNames: ['X'] })
    expect(a).toEqual(b)
  })
})
