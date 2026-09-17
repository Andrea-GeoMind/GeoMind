import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { parseSources, extractAnswerText, extractTokenUsage } from '@/lib/ai/parse'
import { computeCost } from '@/lib/ai/cost'
import { env } from '@/lib/env'

// Recherche via le plugin `web` d'OpenRouter, et non l'outil natif
// web_search_20250305 d'Anthropic.
//
// L'outil natif est une boucle agentique : le modèle lance jusqu'à `max_uses`
// recherches, et chaque tour renvoie l'intégralité du contexte — prompt plus
// tous les résultats déjà collectés. Mesuré sur le prompt réel de production,
// 3 exécutions : 39 163 tokens d'entrée en moyenne (jusqu'à 50 300) pour
// 8,3 sources, soit 0,076 $ l'appel. Le plugin, sur le même prompt :
// 3 568 tokens, 10 sources, 0,017 $. Moins cher ET mieux couvert.
export const CLAUDE_MODEL = 'anthropic/claude-haiku-4-5'
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
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        // Demande le coût facturé : il inclut la recherche web, pas la table locale.
        usage: { include: true },
        // 10 résultats : couvre au moins autant de sources que la boucle
        // agentique qu'on remplace (8,3 en moyenne), sans son inflation.
        plugins: [{ id: 'web', max_results: 10 }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude OpenRouter error ${response.status}: ${await response.text()}`)
    }

    const raw: unknown = await response.json()
    const { sources, partial_response } = parseSources(raw, 'claude')
    const { input, output, cost } = extractTokenUsage(raw)

    return {
      engine: 'claude',
      prompt,
      answer: extractAnswerText(raw),
      sources,
      partial_response,
      tokens_input: input,
      tokens_output: output,
      cost_usd: cost ?? computeCost(CLAUDE_MODEL, input, output),
      raw,
    }
  }
}
