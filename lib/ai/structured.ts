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
// Un appel Haiku normal répond en ~5 s. Sans borne, un OpenRouter lent ou
// suspendu fait traîner la découverte indéfiniment (front bloqué à 90 %).
// 30 s = 6× la normale : généreux mais borné, et chaque retry repart à zéro.
const REQUEST_TIMEOUT_MS = 30_000

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
  const baseMessages: OpenRouterMessage[] = [
    { role: 'system', content: params.systemPrompt },
    { role: 'user', content: params.userContent },
  ]

  // `correction` n'est posée qu'après une réponse mal formée (mauvais JSON / schéma).
  // Un échec transport (timeout, réseau, 429/5xx) réessaie le MÊME appel sans
  // injecter de correction — le modèle n'a rien répondu, il n'y a rien à corriger.
  let correction: string | undefined
  let lastError = 'aucune réponse'

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const messages = [...baseMessages]
    if (correction) {
      messages.push({ role: 'assistant', content: '[réponse précédente invalide]' })
      messages.push({ role: 'user', content: correction })
    }

    // ── Appel HTTP borné par un timeout (AbortController) ──────────────────────
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(OPENROUTER_URL, {
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
        signal: controller.signal,
      })
    } catch (err) {
      // Timeout (AbortError) ou erreur réseau → transitoire : on réessaie un appel frais.
      lastError =
        err instanceof Error && err.name === 'AbortError'
          ? `timeout : OpenRouter n'a pas répondu en ${REQUEST_TIMEOUT_MS / 1000} s`
          : `erreur réseau : ${err instanceof Error ? err.message : String(err)}`
      continue
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const body = await response.text()
      // 429 (rate limit) et 5xx sont transitoires → on réessaie ; 4xx est définitif.
      if (response.status === 429 || response.status >= 500) {
        lastError = `OpenRouter ${response.status}: ${body.slice(0, 200)}`
        continue
      }
      throw new Error(`OpenRouter error ${response.status}: ${body}`)
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
      lastError = `JSON.parse a échoué sur : ${jsonStr.slice(0, 200)}`
      correction = `Ta réponse précédente n'était pas un JSON valide selon le schéma attendu.\nErreur : ${lastError}\nCorrige et retourne UNIQUEMENT le JSON valide, sans texte supplémentaire.`
      continue
    }

    const result = params.schema.safeParse(parsed)
    if (result.success) {
      return { data: result.data, tokensInput, tokensOutput }
    }

    lastError = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    correction = `Ta réponse précédente n'était pas un JSON valide selon le schéma attendu.\nErreur : ${lastError}\nCorrige et retourne UNIQUEMENT le JSON valide, sans texte supplémentaire.`
  }

  throw new Error(
    `callStructured a échoué après ${MAX_RETRIES} tentatives. Dernière erreur : ${lastError}`
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
