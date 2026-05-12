import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test', PERPLEXITY_API_KEY: 'pplx-test' },
}))

import { GeminiConnector } from '@/lib/ai/connectors/gemini'

const MOCK_RESPONSE = {
  id: 'gen-test',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Gemini explique le référencement naturel.',
        annotations: [
          {
            type: 'url_citation',
            url_citation: {
              url: 'https://moz.com/learn/seo',
              title: 'What is SEO? — Moz',
            },
          },
        ],
      },
      finish_reason: 'STOP',
    },
  ],
  usage: { prompt_tokens: 25, completion_tokens: 45 },
}

function makeFetcher(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch
}

describe('GeminiConnector', () => {
  it('respecte l interface IAEngine', () => {
    const connector = new GeminiConnector('test-key', makeFetcher(MOCK_RESPONSE))
    expect(connector.name).toBe('gemini')
  })

  it('retourne une IAResponse valide avec sources', async () => {
    const connector = new GeminiConnector('test-key', makeFetcher(MOCK_RESPONSE))
    const result = await connector.query('C est quoi le SEO ?')

    expect(result.engine).toBe('gemini')
    expect(result.sources[0].domain).toBe('moz.com')
    expect(result.partial_response).toBe(false)
  })

  it('fallback sur markdown links si pas d annotations', async () => {
    const noAnnotations = {
      ...MOCK_RESPONSE,
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Consulter [Moz](https://moz.com/learn/seo) pour apprendre le SEO.',
          },
        },
      ],
    }
    const connector = new GeminiConnector('test-key', makeFetcher(noAnnotations))
    const result = await connector.query('test')
    expect(result.sources).toHaveLength(1)
    expect(result.partial_response).toBe(false)
  })

  it('lève une erreur sur réponse HTTP non-2xx', async () => {
    const connector = new GeminiConnector('test-key', makeFetcher({}, 500))
    await expect(connector.query('test')).rejects.toThrow('500')
  })
})
