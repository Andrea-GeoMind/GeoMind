import { describe, it, expect } from 'vitest'
import { computeScores } from '@/lib/analysis/scoring'

describe('computeScores', () => {
  it('returns 0 authority score and correct global score when no authority calls were made', () => {
    const result = computeScores(
      { successfulCalls: 0, clientCitationsFound: 0 },
      80,
      80
    )
    expect(result.authorityScore).toBe(0)
    // global = mean(0, 80, 80) = 53
    expect(result.globalScore).toBe(Math.round((0 + 80 + 80) / 3))
  })

  it('returns 100 authority score when every IA response cites the client', () => {
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 10 },
      80,
      80
    )
    expect(result.authorityScore).toBe(100)
  })

  it('returns 50 authority score when half of IA responses cite the client', () => {
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 5 },
      80,
      80
    )
    expect(result.authorityScore).toBe(50)
  })

  it('global score is the mean of the 3 pillar scores', () => {
    // authority = 50, technical = 80, content = 80 → mean = 70
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 5 },
      80,
      80
    )
    expect(result.globalScore).toBe(Math.round((50 + 80 + 80) / 3))
  })

  it('clamps scores to [0, 100]', () => {
    const result = computeScores(
      { successfulCalls: 1, clientCitationsFound: 0 },
      -10,
      110
    )
    expect(result.technicalScore).toBe(0)
    expect(result.contentScore).toBe(100)
    expect(result.globalScore).toBeGreaterThanOrEqual(0)
    expect(result.globalScore).toBeLessThanOrEqual(100)
  })

  it('passes technical and content scores through unchanged (within bounds)', () => {
    const result = computeScores(
      { successfulCalls: 4, clientCitationsFound: 2 },
      65,
      72
    )
    expect(result.technicalScore).toBe(65)
    expect(result.contentScore).toBe(72)
  })
})
