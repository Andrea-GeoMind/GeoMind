import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: {
    OPENROUTER_API_KEY: 'sk-or-test',
    PERPLEXITY_API_KEY: 'pplx-test',
  },
}))

vi.mock('@/lib/monitoring', () => ({
  captureEngineFailure: vi.fn(),
  captureEngineOutage: vi.fn(),
  captureJobFailure: vi.fn(),
}))

import { probeEngine } from '@/lib/inngest/functions/healthcheck-engines'
import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'

function fakeEngine(name: IAEngine['name'], impl: () => Promise<IAResponse>): IAEngine {
  return { name, query: impl }
}

function okResponse(overrides: Partial<IAResponse> = {}): IAResponse {
  return {
    engine: 'chatgpt',
    prompt: 'test',
    answer: 'Une réponse.',
    sources: [{ url: 'https://exemple.fr', title: null, domain: 'exemple.fr' }],
    partial_response: false,
    tokens_input: 10,
    tokens_output: 20,
    cost_usd: 0.001,
    ...overrides,
  }
}

describe('probeEngine', () => {
  it('rapporte un moteur sain', async () => {
    const result = await probeEngine(fakeEngine('claude', async () => okResponse()))
    expect(result.ok).toBe(true)
    expect(result.degraded).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('rapporte une panne sans lever — le cron ne doit pas mourir sur un moteur KO', async () => {
    const result = await probeEngine(
      fakeEngine('perplexity', async () => {
        throw new Error('Perplexity error 401: Invalid API key provided')
      })
    )
    expect(result.ok).toBe(false)
    expect(result.error).toContain('401')
  })

  it('signale « dégradé » quand le moteur répond sans aucune source', async () => {
    const result = await probeEngine(
      fakeEngine('gemini', async () => okResponse({ sources: [], partial_response: true }))
    )
    expect(result.ok).toBe(true)
    expect(result.degraded).toBe(true)
  })

  it('mesure la durée de réponse', async () => {
    const result = await probeEngine(
      fakeEngine('chatgpt', async () => {
        await new Promise((r) => setTimeout(r, 20))
        return okResponse()
      })
    )
    expect(result.durationMs).toBeGreaterThanOrEqual(15)
  })

  it('gère une erreur non-Error', async () => {
    const result = await probeEngine(
      fakeEngine('chatgpt', async () => {
        throw 'panne brute'
      })
    )
    expect(result.ok).toBe(false)
    expect(result.error).toBe('panne brute')
  })
})
