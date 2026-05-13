import { describe, it, expect } from 'vitest'
import { computeDeltas } from '@/lib/analysis/compare'

describe('computeDeltas', () => {
  it('returns positive deltas when current scores are higher', () => {
    const current  = { globalScore: 60, authorityScore: 70, technicalScore: 55, contentScore: 65 }
    const previous = { globalScore: 50, authorityScore: 60, technicalScore: 45, contentScore: 55 }
    expect(computeDeltas(current, previous)).toEqual({
      globalDelta:    10,
      authorityDelta: 10,
      technicalDelta: 10,
      contentDelta:   10,
    })
  })

  it('returns negative deltas when current scores are lower', () => {
    const current  = { globalScore: 40, authorityScore: 30, technicalScore: 50, contentScore: 45 }
    const previous = { globalScore: 55, authorityScore: 60, technicalScore: 70, contentScore: 65 }
    expect(computeDeltas(current, previous)).toEqual({
      globalDelta:    -15,
      authorityDelta: -30,
      technicalDelta: -20,
      contentDelta:   -20,
    })
  })

  it('returns zeros when both analyses have identical scores', () => {
    const scores = { globalScore: 72, authorityScore: 80, technicalScore: 70, contentScore: 66 }
    expect(computeDeltas(scores, scores)).toEqual({
      globalDelta:    0,
      authorityDelta: 0,
      technicalDelta: 0,
      contentDelta:   0,
    })
  })

  it('is deterministic — same inputs always produce the same output', () => {
    const current  = { globalScore: 58, authorityScore: 45, technicalScore: 75, contentScore: 54 }
    const previous = { globalScore: 50, authorityScore: 40, technicalScore: 70, contentScore: 40 }
    expect(computeDeltas(current, previous)).toEqual(computeDeltas(current, previous))
  })
})
