import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

/**
 * Perplexity Sonar, routé via OpenRouter.
 *
 * L'API Perplexity directe demandait un abonnement et une clé dédiée
 * (`PERPLEXITY_API_KEY`). OpenRouter expose le même modèle Sonar avec la clé
 * que les trois autres connecteurs utilisent déjà — un fournisseur de moins à
 * maintenir, et un moteur de moins à risquer de perdre par clé expirée.
 *
 * Conséquence sur le parsing : OpenRouter normalise les citations au format
 * OpenAI (`annotations` / `url_citation`) au lieu du tableau `citations` que
 * renvoie l'API native. `parseSources` accepte les deux formats pour ce
 * moteur — un retour à l'API directe ne casserait rien.
 */
export const PERPLEXITY_MODEL = 'perplexity/sonar'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

type Fetcher = typeof fetch

export class PerplexityConnector implements IAEngine {
  readonly name = 'perplexity' as const
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
        model: PERPLEXITY_MODEL,
        messages: [{ role: 'user', content: prompt }],
        // Demande le coût facturé : il inclut la recherche web, pas la table locale.
        usage: { include: true },
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity error ${response.status}: ${await response.text()}`)
    }

    const raw: unknown = await response.json()
    const { sources, partial_response } = parseSources(raw, 'perplexity')
    const { input, output, cost } = extractTokenUsage(raw)

    return {
      engine: 'perplexity',
      prompt,
      answer: extractAnswerText(raw),
      sources,
      partial_response,
      tokens_input: input,
      tokens_output: output,
      cost_usd: cost ?? computeCost(PERPLEXITY_MODEL, input, output),
      raw,
    }
  }
}
