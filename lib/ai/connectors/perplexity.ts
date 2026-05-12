import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

// API Perplexity directe (format OpenAI-compatible)
const MODEL = 'sonar'
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions'

type Fetcher = typeof fetch

export class PerplexityConnector implements IAEngine {
  readonly name = 'perplexity' as const
  private readonly apiKey: string
  private readonly fetcher: Fetcher

  constructor(apiKey?: string, fetcher: Fetcher = fetch) {
    this.apiKey = apiKey ?? env.PERPLEXITY_API_KEY
    this.fetcher = fetcher
  }

  async query(prompt: string): Promise<IAResponse> {
    const response = await this.fetcher(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        // Perplexity retourne les citations dans le champ `citations`
        return_citations: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity error ${response.status}: ${await response.text()}`)
    }

    const raw: unknown = await response.json()
    const { sources, partial_response } = parseSources(raw, 'perplexity')
    const { input, output } = extractTokenUsage(raw)

    return {
      engine: 'perplexity',
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
