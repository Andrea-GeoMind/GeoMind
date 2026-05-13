import { describe, it, expect } from 'vitest'
import {
  computeAuthorityScore,
  computeTechnicalScore,
  computeContentScore,
  computeGlobalScore,
  computeScores,
} from '@/lib/analysis/scoring'

// ─── computeAuthorityScore ────────────────────────────────────────────────────

describe('computeAuthorityScore', () => {
  it('returns 0 when site is never cited', () => {
    expect(computeAuthorityScore(10, 0)).toBe(0)
  })

  it('returns 100 when every IA call cites the client (top 1 each time)', () => {
    expect(computeAuthorityScore(10, 10)).toBe(100)
  })

  it('returns 50 for mixed case (half cited)', () => {
    expect(computeAuthorityScore(10, 5)).toBe(50)
  })

  it('returns 0 when successfulCalls is 0 (no data)', () => {
    expect(computeAuthorityScore(0, 0)).toBe(0)
  })

  it('clamps to 100 when clientCitationsFound exceeds successfulCalls', () => {
    // Possible when a single IA response cites the domain multiple times
    expect(computeAuthorityScore(4, 8)).toBe(100)
  })

  it('is deterministic — same inputs always produce the same output', () => {
    const a = computeAuthorityScore(7, 3)
    const b = computeAuthorityScore(7, 3)
    expect(a).toBe(b)
  })
})

// ─── computeTechnicalScore ────────────────────────────────────────────────────

describe('computeTechnicalScore', () => {
  it('returns 100 when there are no penalties (perfect site)', () => {
    expect(computeTechnicalScore([])).toBe(100)
  })

  it('returns 0 when total penalties reach or exceed 100', () => {
    expect(computeTechnicalScore([100])).toBe(0)
    expect(computeTechnicalScore([60, 50])).toBe(0)
  })

  it('subtracts cumulative penalties from 100', () => {
    expect(computeTechnicalScore([20, 30])).toBe(50)
    expect(computeTechnicalScore([10])).toBe(90)
  })

  it('handles a single large penalty', () => {
    expect(computeTechnicalScore([75])).toBe(25)
  })

  it('is deterministic', () => {
    const a = computeTechnicalScore([15, 20])
    const b = computeTechnicalScore([15, 20])
    expect(a).toBe(b)
  })
})

// ─── computeContentScore ──────────────────────────────────────────────────────

describe('computeContentScore', () => {
  it('returns 100 when there are no penalties', () => {
    expect(computeContentScore([])).toBe(100)
  })

  it('returns 0 when total penalties reach or exceed 100', () => {
    expect(computeContentScore([100])).toBe(0)
    expect(computeContentScore([55, 55])).toBe(0)
  })

  it('subtracts cumulative penalties from 100', () => {
    expect(computeContentScore([40])).toBe(60)
    expect(computeContentScore([10, 15, 25])).toBe(50)
  })

  it('is deterministic', () => {
    const a = computeContentScore([30, 20])
    const b = computeContentScore([30, 20])
    expect(a).toBe(b)
  })
})

// ─── computeGlobalScore ───────────────────────────────────────────────────────

describe('computeGlobalScore', () => {
  it('returns 100 when all 3 pillar scores are 100', () => {
    expect(computeGlobalScore(100, 100, 100)).toBe(100)
  })

  it('returns 0 when all 3 pillar scores are 0', () => {
    expect(computeGlobalScore(0, 0, 0)).toBe(0)
  })

  it('is the rounded mean of the 3 pillar scores', () => {
    // (0 + 80 + 80) / 3 = 53.33 → rounds to 53
    expect(computeGlobalScore(0, 80, 80)).toBe(Math.round((0 + 80 + 80) / 3))
    // (50 + 80 + 80) / 3 = 70
    expect(computeGlobalScore(50, 80, 80)).toBe(Math.round((50 + 80 + 80) / 3))
  })

  it('clamps to [0, 100]', () => {
    expect(computeGlobalScore(-10, 80, 80)).toBeGreaterThanOrEqual(0)
    expect(computeGlobalScore(110, 80, 80)).toBeLessThanOrEqual(100)
  })

  it('is deterministic', () => {
    const a = computeGlobalScore(60, 70, 80)
    const b = computeGlobalScore(60, 70, 80)
    expect(a).toBe(b)
  })
})

// ─── computeScores (orchestrateur) ────────────────────────────────────────────

describe('computeScores', () => {
  it('returns 0 authority score when no IA calls were made', () => {
    const result = computeScores({ successfulCalls: 0, clientCitationsFound: 0 }, 80, 80)
    expect(result.authorityScore).toBe(0)
  })

  it('global score is the mean of the 3 pillars', () => {
    const result = computeScores({ successfulCalls: 0, clientCitationsFound: 0 }, 80, 80)
    // authority=0, technical=80, content=80 → (0+80+80)/3 ≈ 53
    expect(result.globalScore).toBe(Math.round((0 + 80 + 80) / 3))
  })

  it('returns 100 authority score when every IA call cites the client', () => {
    const result = computeScores({ successfulCalls: 10, clientCitationsFound: 10 }, 80, 80)
    expect(result.authorityScore).toBe(100)
  })

  it('returns 50 authority score when half of IA responses cite the client', () => {
    const result = computeScores({ successfulCalls: 10, clientCitationsFound: 5 }, 80, 80)
    expect(result.authorityScore).toBe(50)
  })

  it('passes technical and content scores through unchanged (within bounds)', () => {
    const result = computeScores({ successfulCalls: 4, clientCitationsFound: 2 }, 65, 72)
    expect(result.technicalScore).toBe(65)
    expect(result.contentScore).toBe(72)
  })

  it('clamps out-of-range technical and content scores', () => {
    const result = computeScores({ successfulCalls: 1, clientCitationsFound: 0 }, -10, 110)
    expect(result.technicalScore).toBe(0)
    expect(result.contentScore).toBe(100)
    expect(result.globalScore).toBeGreaterThanOrEqual(0)
    expect(result.globalScore).toBeLessThanOrEqual(100)
  })

  it('is fully deterministic — same inputs always produce the same outputs', () => {
    const input = { successfulCalls: 8, clientCitationsFound: 3 }
    const a = computeScores(input, 70, 60)
    const b = computeScores(input, 70, 60)
    expect(a).toEqual(b)
  })
})
