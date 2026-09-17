import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

// gpt-4o-mini-search-preview a été retiré d'OpenRouter (404 « No endpoints found ») ;
// le plugin `web` fournit la recherche + annotations url_citation sur le modèle éco courant.
//
// Modèle éco et NON raisonneur, délibérément. Mesuré sur le prompt réel de
// production, 3 exécutions chacun : gpt-5-mini 29 776 tokens d'entrée et
// 0,072 $ l'appel ; gpt-5-nano pire encore (54 098 tokens, 0,167 $) ; alors
// que gpt-4o-mini tient 2 928 tokens pour 0,0079 $ — à 10 sources dans les
// trois cas. Les modèles à raisonnement font exploser l'entrée dès qu'on y
// branche le plugin web, sans rien apporter sur une question de liste.
export const CHATGPT_MODEL = 'openai/gpt-4o-mini'
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
        model: CHATGPT_MODEL,
        plugins: [{ id: 'web', max_results: 10 }],
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
      cost_usd: computeCost(CHATGPT_MODEL, input, output),
      raw,
    }
  }
}
