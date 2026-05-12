import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test', PERPLEXITY_API_KEY: 'pplx-test' },
}))

import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'

const MOCK_RESPONSE = {
  id: 'pplx-test',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Perplexity répond à propos des meilleurs outils SEO en France.',
      },
      finish_reason: 'stop',
    },
  ],
  citations: [
    'https://www.semrush.com/blog/seo-tools/',
    'https://ahrefs.com/blog/free-seo-tools/',
    'https://backlinko.com/seo-tools',
  ],
  usage: { prompt_tokens: 18, completion_tokens: 42 },
}

function makeFetcher(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch
}

describe('PerplexityConnector', () => {
  it('respecte l interface IAEngine', () => {
    const connector = new PerplexityConnector('test-key', makeFetcher(MOCK_RESPONSE))
    expect(connector.name).toBe('perplexity')
  })

  it('retourne une IAResponse valide avec 3 sources depuis citations', async () => {
    const connector = new PerplexityConnector('test-key', makeFetcher(MOCK_RESPONSE))
    const result = await connector.query('Quels sont les meilleurs outils SEO ?')

    expect(result.engine).toBe('perplexity')
    expect(result.sources).toHaveLength(3)
    expect(result.sources[0].domain).toBe('semrush.com')
    expect(result.sources[1].domain).toBe('ahrefs.com')
    expect(result.sources[2].domain).toBe('backlinko.com')
    expect(result.partial_response).toBe(false)
    expect(result.tokens_input).toBe(18)
    expect(result.tokens_output).toBe(42)
    expect(result.cost_usd).toBeGreaterThan(0)
  })

  it('retourne partial_response=true si citations absentes', async () => {
    const noCitations = {
      id: 'pplx-test',
      choices: [{ message: { content: 'Réponse sans source' } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    }
    const connector = new PerplexityConnector('test-key', makeFetcher(noCitations))
    const result = await connector.query('test')
    expect(result.partial_response).toBe(true)
    expect(result.sources).toHaveLength(0)
  })

  it('lève une erreur sur réponse HTTP non-2xx', async () => {
    const connector = new PerplexityConnector('test-key', makeFetcher({ error: 'Bad request' }, 400))
    await expect(connector.query('test')).rejects.toThrow('400')
  })
})
