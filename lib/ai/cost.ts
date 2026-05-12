// Tracking des coûts LLM par modèle.
// Règle CLAUDE.md §10 : logger le coût estimé avant chaque batch LLM,
// alerter via Sentry si une analyse dépasse 5 €.

// ─── Table des prix (USD / million de tokens) ─────────────────────────────────

export const MODEL_PRICING = {
  // OpenRouter — ChatGPT
  'openai/gpt-4o-mini-search-preview': { input: 0.15, output: 0.6 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  // OpenRouter — Claude
  'anthropic/claude-haiku-4-5': { input: 0.8, output: 4.0 },
  'anthropic/claude-haiku-4-5:beta': { input: 0.8, output: 4.0 },
  // OpenRouter — Gemini
  'google/gemini-2.5-flash': { input: 0.075, output: 0.3 },
  'google/gemini-2.5-flash:thinking': { input: 0.075, output: 0.3 },
  // Perplexity — Sonar
  'sonar': { input: 1.0, output: 1.0 },
  'sonar-pro': { input: 3.0, output: 15.0 },
} as const

export type KnownModel = keyof typeof MODEL_PRICING

// ─── computeCost ──────────────────────────────────────────────────────────────

/**
 * Calcule le coût en USD pour un appel donné.
 * Pure function — même inputs = même output (règle §9 scoring idempotent).
 */
export function computeCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  const pricing = MODEL_PRICING[model as KnownModel]
  if (!pricing) return 0

  const costInput = (tokensInput / 1_000_000) * pricing.input
  const costOutput = (tokensOutput / 1_000_000) * pricing.output
  return Math.round((costInput + costOutput) * 1_000_000) / 1_000_000
}

// ─── logEstimatedBatchCost ────────────────────────────────────────────────────

export interface BatchCall {
  model: string
  estimatedInputTokens: number
  estimatedOutputTokens: number
}

/**
 * Calcule et logue le coût estimé avant un batch d'appels LLM.
 * Retourne le coût total estimé en USD.
 */
export function logEstimatedBatchCost(calls: BatchCall[]): number {
  const total = calls.reduce(
    (sum, c) => sum + computeCost(c.model, c.estimatedInputTokens, c.estimatedOutputTokens),
    0
  )

  console.log(
    `[GeoMind/cost] Batch estimé : ${calls.length} appels — ~$${total.toFixed(4)} USD`
  )

  // Alerte si le batch dépasse 5 € (~5.5 USD) — signal d'anomalie (règle §10)
  if (total > 5.5) {
    console.error(
      `[GeoMind/cost] ⚠️ Coût batch anormal : $${total.toFixed(4)} > seuil $5.50`
    )
  }

  return total
}
