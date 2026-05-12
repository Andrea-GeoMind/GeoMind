import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test', PERPLEXITY_API_KEY: 'pplx-test' },
}))

import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'

const MOCK_RESPONSE = {
  id: 'chatcmpl-test',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Voici une réponse sur la pâtisserie française.',
        annotations: [
          {
            type: 'url_citation',
            url_citation: {
              url: 'https://fr.wikipedia.org/wiki/P%C3%A2tisserie',
              title: 'Pâtisserie — Wikipédia',
              start_index: 0,
              end_index: 10,
            },
          },
        ],
      },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 20, completion_tokens: 35 },
}

function makeFetcher(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch
}

describe('ChatGPTConnector', () => {
  it('respecte l interface IAEngine', () => {
    const connector = new ChatGPTConnector('test-key', makeFetcher(MOCK_RESPONSE))
    expect(connector.name).toBe('chatgpt')
    expect(typeof connector.query).toBe('function')
  })

  it('retourne une IAResponse valide avec sources', async () => {
    const connector = new ChatGPTConnector('test-key', makeFetcher(MOCK_RESPONSE))
    const result = await connector.query('Qu est-ce que la pâtisserie française ?')

    expect(result.engine).toBe('chatgpt')
    expect(result.answer).toBe('Voici une réponse sur la pâtisserie française.')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].domain).toBe('fr.wikipedia.org')
    expect(result.partial_response).toBe(false)
    expect(result.tokens_input).toBe(20)
    expect(result.tokens_output).toBe(35)
    expect(result.cost_usd).toBeGreaterThan(0)
  })

  it('lève une erreur sur réponse HTTP non-2xx', async () => {
    const connector = new ChatGPTConnector('test-key', makeFetcher({ error: 'Unauthorized' }, 401))
    await expect(connector.query('test')).rejects.toThrow('401')
  })

  it('retourne partial_response=true si aucune source', async () => {
    const noSources = {
      ...MOCK_RESPONSE,
      choices: [{ message: { content: 'Réponse sans citation', role: 'assistant' } }],
    }
    const connector = new ChatGPTConnector('test-key', makeFetcher(noSources))
    const result = await connector.query('test')
    expect(result.partial_response).toBe(true)
    expect(result.sources).toHaveLength(0)
  })
})
