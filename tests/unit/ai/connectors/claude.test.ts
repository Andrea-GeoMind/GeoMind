import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test', PERPLEXITY_API_KEY: 'pplx-test' },
}))

import { ClaudeConnector } from '@/lib/ai/connectors/claude'

const MOCK_RESPONSE = {
  id: 'msg-test',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Claude répond sur les agences SEO.',
        annotations: [
          {
            type: 'url_citation',
            url_citation: {
              url: 'https://www.journaldunet.com/solutions/seo/',
              title: 'SEO — JDN',
            },
          },
        ],
      },
      finish_reason: 'end_turn',
    },
  ],
  usage: { prompt_tokens: 30, completion_tokens: 50 },
}

function makeFetcher(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch
}

describe('ClaudeConnector', () => {
  it('respecte l interface IAEngine', () => {
    const connector = new ClaudeConnector('test-key', makeFetcher(MOCK_RESPONSE))
    expect(connector.name).toBe('claude')
  })

  it('retourne une IAResponse valide avec sources', async () => {
    const connector = new ClaudeConnector('test-key', makeFetcher(MOCK_RESPONSE))
    const result = await connector.query('Quelles sont les meilleures agences SEO ?')

    expect(result.engine).toBe('claude')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].domain).toBe('journaldunet.com')
    expect(result.partial_response).toBe(false)
    expect(result.cost_usd).toBeGreaterThan(0)
  })

  it('lève une erreur sur réponse HTTP non-2xx', async () => {
    const connector = new ClaudeConnector('test-key', makeFetcher({ error: 'Rate limit' }, 429))
    await expect(connector.query('test')).rejects.toThrow('429')
  })
})
