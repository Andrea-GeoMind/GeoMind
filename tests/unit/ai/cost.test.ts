import { describe, it, expect, vi } from 'vitest'
import { computeCost, logEstimatedBatchCost } from '@/lib/ai/cost'

describe('computeCost', () => {
  it('calcule le coût pour gpt-4o-mini-search-preview', () => {
    // 1M tokens input + 1M tokens output → $0.15 + $0.60 = $0.75
    const cost = computeCost('openai/gpt-4o-mini-search-preview', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(0.75, 5)
  })

  it('calcule le coût pour claude-haiku-4-5', () => {
    // 500k input + 200k output → $0.40 + $0.80 = $1.20... wait
    // 500k input = 0.5M × $0.80 = $0.40
    // 200k output = 0.2M × $4.00 = $0.80
    const cost = computeCost('anthropic/claude-haiku-4-5', 500_000, 200_000)
    expect(cost).toBeCloseTo(0.4 + 0.8, 5)
  })

  it('calcule le coût pour gemini-2.5-flash', () => {
    // 1M input × $0.075 + 1M output × $0.30 = $0.375
    const cost = computeCost('google/gemini-2.5-flash', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(0.375, 5)
  })

  it('calcule le coût pour sonar (perplexity)', () => {
    // 100k input × $1.00 + 100k output × $1.00 = $0.20
    const cost = computeCost('sonar', 100_000, 100_000)
    expect(cost).toBeCloseTo(0.2, 5)
  })

  it('retourne 0 pour un modèle inconnu', () => {
    expect(computeCost('unknown/model', 1000, 1000)).toBe(0)
  })

  it('retourne 0 pour zéro tokens', () => {
    expect(computeCost('openai/gpt-4o-mini', 0, 0)).toBe(0)
  })

  it('est déterministe — même inputs = même output', () => {
    const a = computeCost('openai/gpt-4o-mini', 12345, 67890)
    const b = computeCost('openai/gpt-4o-mini', 12345, 67890)
    expect(a).toBe(b)
  })
})

describe('logEstimatedBatchCost', () => {
  it('calcule le total du batch', () => {
    const total = logEstimatedBatchCost([
      { model: 'openai/gpt-4o-mini', estimatedInputTokens: 1_000_000, estimatedOutputTokens: 0 },
      { model: 'google/gemini-2.5-flash', estimatedInputTokens: 1_000_000, estimatedOutputTokens: 0 },
    ])
    // $0.15 + $0.075 = $0.225
    expect(total).toBeCloseTo(0.225, 5)
  })

  it('alerte sur console.error si > 5.5 USD', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logEstimatedBatchCost([
      { model: 'anthropic/claude-haiku-4-5', estimatedInputTokens: 5_000_000, estimatedOutputTokens: 5_000_000 },
    ])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('anormal'))
    spy.mockRestore()
  })
})
