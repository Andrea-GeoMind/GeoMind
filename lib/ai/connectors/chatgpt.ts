import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

const MODEL = 'openai/gpt-4o-mini-search-preview'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Injectable pour les tests
type Fetcher = typeof fetch

export class ChatGPTConnector implements IAEngine {
  readonly name = 'chatgpt' as const
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
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`ChatGPT OpenRouter error ${response.status}: ${await response.text()}`)
    }

    const raw: unknown = await response.json()
    const { sources, partial_response } = parseSources(raw, 'chatgpt')
    const { input, output } = extractTokenUsage(raw)

    return {
      engine: 'chatgpt',
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
