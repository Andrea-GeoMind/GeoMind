import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

// Modèle beta pour activer l'outil web_search natif Anthropic via OpenRouter
const MODEL = 'anthropic/claude-haiku-4-5:beta'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

type Fetcher = typeof fetch

export class ClaudeConnector implements IAEngine {
  readonly name = 'claude' as const
  private readonly apiKey: string
  private readonly fetcher: Fetcher

  constructor(apiKey?: string, fetcher: Fetcher = fetch) {
    this.apiKey = apiKey ?? env.OPENROUTER_API_KEY
    this.fetcher = fetcher
  }

  async query(prompt: string): Promise<IAResponse> {
    const response = await this.fetcher(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://geomind.fr',
        'X-Title': 'GeoMind',
        // Active les outils beta Anthropic (web_search_20250305)
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude OpenRouter error ${response.status}: ${await response.text()}`)
    }

    const raw: unknown = await response.json()
    const { sources, partial_response } = parseSources(raw, 'claude')
    const { input, output } = extractTokenUsage(raw)

    return {
      engine: 'claude',
      prompt,
      answer: extractAnswerText(raw),
      sources,
      partial_response,
      tokens_input: input,
      tokens_output: output,
      cost_usd: computeCost(MODEL, input, output),
      raw,
    }
  }
}
