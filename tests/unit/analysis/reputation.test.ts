import { describe, it, expect } from 'vitest'
import {
  normalizeClaimValue,
  summarizeReputation,
  type ReputationResultLite,
} from '@/lib/analysis/reputation'

describe('normalizeClaimValue', () => {
  it('normalise pour comparaison (accents, casse, ponctuation)', () => {
    expect(normalizeClaimValue('Lyon 3ème')).toBe(normalizeClaimValue('lyon 3eme'))
    expect(normalizeClaimValue('  Fermé le LUNDI. ')).toBe('ferme le lundi')
  })
})

describe('summarizeReputation', () => {
  const r = (
    engine: ReputationResultLite['engine'],
    sentiment: ReputationResultLite['sentiment'],
    claims: { type: string; value: string }[],
    knowsBusiness = true
  ): ReputationResultLite => ({ engine, sentiment, knowsBusiness, claims })

  it('détecte un désaccord factuel entre moteurs (hallucination)', () => {
    const s = summarizeReputation([
      r('chatgpt', 'positive', [{ type: 'horaires', value: 'fermé le lundi' }]),
      r('claude', 'neutral', [{ type: 'horaires', value: 'ouvert tous les jours' }]),
    ])
    expect(s.disagreements).toHaveLength(1)
    expect(s.disagreements[0].type).toBe('horaires')
    expect(s.disagreements[0].variants).toHaveLength(2)
  })

  it('ne signale pas de désaccord si les moteurs concordent (après normalisation)', () => {
    const s = summarizeReputation([
      r('chatgpt', 'positive', [{ type: 'ville', value: 'Lyon' }]),
      r('claude', 'positive', [{ type: 'ville', value: 'lyon' }]),
    ])
    expect(s.disagreements).toHaveLength(0)
    // Une seule valeur consolidée, soutenue par 2 moteurs
    const ville = s.claimsByType.find((c) => c.type === 'ville')!
    expect(ville.values).toHaveLength(1)
    expect(ville.values[0].engines).toHaveLength(2)
  })

  it('ne traite pas activité/service comme des désaccords (champs trop libres)', () => {
    const s = summarizeReputation([
      r('chatgpt', 'neutral', [{ type: 'service', value: 'plomberie' }]),
      r('claude', 'neutral', [{ type: 'service', value: 'chauffage' }]),
    ])
    expect(s.disagreements).toHaveLength(0)
  })

  it('calcule le sentiment dominant et priorise le négatif à égalité', () => {
    const s = summarizeReputation([
      r('chatgpt', 'positive', []),
      r('claude', 'negative', []),
    ])
    expect(s.overallSentiment).toBe('negative')
  })

  it('ignore les moteurs qui ne connaissent pas l’entreprise', () => {
    const s = summarizeReputation([
      r('chatgpt', 'neutral', [{ type: 'ville', value: 'Paris' }], false),
      r('claude', 'positive', [{ type: 'ville', value: 'Lyon' }], true),
    ])
    expect(s.knownByEngines).toEqual(['claude'])
    // Pas de désaccord : un seul moteur connaît l'entreprise
    expect(s.disagreements).toHaveLength(0)
  })
})
