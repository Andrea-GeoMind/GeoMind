// Helper pour les appels LLM avec sortie JSON structurée validée par Zod.
// Règle CLAUDE.md §8 : toutes les sorties LLM sont validées par Zod.
// Retry avec message d'erreur correctif si le parsing échoue.

import { z } from 'zod'
import { env } from '@/lib/env'

// Schémas dans un fichier sans dépendances I/O (importable en tests unitaires)
export {
  DiscoveryOutputSchema,
  NeutralPromptsOutputSchema,
  type DiscoveryOutput,
  type NeutralPromptsOutput,
} from '@/lib/ai/schemas'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DISCOVERY_MODEL = 'anthropic/claude-haiku-4-5'
const MAX_RETRIES = 3

// ─── Types internes ───────────────────────────────────────────────────────────

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export interface StructuredCallResult<T> {
  data: T
  tokensInput: number
  tokensOutput: number
}

// ─── callStructured ───────────────────────────────────────────────────────────

/**
 * Appelle Claude Haiku via OpenRouter et valide la réponse JSON avec le schéma Zod fourni.
 * Retry automatique (MAX_RETRIES) avec message d'erreur correctif si le parsing échoue.
 */
export async function callStructured<T>(params: {
  systemPrompt: string
  userContent: string
  schema: z.ZodSchema<T>
  model?: string
}): Promise<StructuredCallResult<T>> {
  const model = params.model ?? DISCOVERY_MODEL
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: params.systemPrompt },
    { role: 'user', content: params.userContent },
  ]

  let lastParseError: string | undefined

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (lastParseError && attempt > 0) {
      messages.push({
        role: 'assistant',
        content: '[réponse précédente invalide]',
      })
      messages.push({
        role: 'user',
        content: `Ta réponse précédente n'était pas un JSON valide selon le schéma attendu.\nErreur : ${lastParseError}\nCorrige et retourne UNIQUEMENT le JSON valide, sans texte supplémentaire.`,
      })
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://geomind.fr',
        'X-Title': 'GeoMind',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`)
    }

    const raw = (await response.json()) as OpenRouterResponse
    const content = raw.choices[0]?.message?.content ?? ''
    const tokensInput = raw.usage?.prompt_tokens ?? 0
    const tokensOutput = raw.usage?.completion_tokens ?? 0

    const jsonStr = extractJsonFromContent(content)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      lastParseError = `JSON.parse a échoué sur : ${jsonStr.slice(0, 200)}`
      continue
    }

    const result = params.schema.safeParse(parsed)
    if (result.success) {
      return { data: result.data, tokensInput, tokensOutput }
    }

    lastParseError = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
  }

  throw new Error(
    `callStructured a échoué après ${MAX_RETRIES} tentatives. Dernière erreur : ${lastParseError}`
  )
}

// ─── Helpers privés ───────────────────────────────────────────────────────────

function extractJsonFromContent(content: string): string {
  const trimmed = content.trim()

  // Retire les blocs markdown ```json ... ``` ou ``` ... ```
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m)
  if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim()

  // Cherche le premier { ... } ou [ ... ] dans la réponse
  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch?.[0]) return jsonMatch[0]

  return trimmed
}
