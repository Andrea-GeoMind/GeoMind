/**
 * lib/analysis/reputation-runner.ts
 *
 * Orchestrateur de l'analyse de réputation (PLAN item 31) — IMPUR (appels IA).
 * Invoqué uniquement par la fonction Inngest run-reputation-check, jamais en
 * route/action synchrone (règle CLAUDE.md §1).
 *
 * Pour chaque moteur : on demande ce qu'il sait de l'entreprise (réponse libre,
 * search activé), puis Haiku extrait sentiment + affirmations (callStructured,
 * sortie validée par Zod — règle §8).
 */

import { getSiteById } from '@/lib/db/queries/sites'
import { callStructured } from '@/lib/ai/structured'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { ReputationExtractSchema } from '@/lib/ai/schemas'
import {
  buildReputationQuery,
  REPUTATION_EXTRACT_SYSTEM_PROMPT,
  buildReputationExtractMessage,
} from '@/lib/ai/prompts/reputation'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import { IAResponseSchema } from '@/lib/ai/schemas'
import {
  createReputationResult,
  type ReputationResultRow,
} from '@/lib/db/queries/reputation'
import type { IAEngine } from '@/lib/ai/connectors/base'

const HAIKU_MODEL = 'anthropic/claude-haiku-4-5'

export interface ReputationRunResult {
  enginesQueried: number
  enginesAnswered: number
  totalCostUsd: number
}

export async function runReputationCheck(
  runId: string,
  siteId: string
): Promise<ReputationRunResult> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`Site introuvable : ${siteId}`)

  const engines: IAEngine[] = [
    new ChatGPTConnector(),
    new ClaudeConnector(),
    new GeminiConnector(),
    new PerplexityConnector(),
  ]

  // Estimation coût (règle §10) : 4 requêtes moteur + 4 extractions Haiku
  logEstimatedBatchCost([
    ...engines.map(() => ({
      model: 'openai/gpt-4o-mini',
      estimatedInputTokens: 80,
      estimatedOutputTokens: 400,
    })),
    ...engines.map(() => ({
      model: HAIKU_MODEL,
      estimatedInputTokens: 700,
      estimatedOutputTokens: 200,
    })),
  ])

  const query = buildReputationQuery(site.name, site.url)
  let enginesAnswered = 0
  let totalCostUsd = 0

  // Séquentiel : volume faible, pas de pic de charge (et concurrence gérée par Inngest)
  for (const engine of engines) {
    let answer: string
    let costUsd = 0
    try {
      const raw = IAResponseSchema.parse(await engine.query(query))
      answer = raw.answer
      costUsd = raw.cost_usd
    } catch (err) {
      console.error(`[reputation] ${engine.name} requête échouée:`, err)
      continue
    }
    totalCostUsd += costUsd
    enginesAnswered++

    // Extraction sentiment + claims
    let extracted: ReputationResultRow['extract']
    try {
      const res = await callStructured({
        systemPrompt: REPUTATION_EXTRACT_SYSTEM_PROMPT,
        userContent: buildReputationExtractMessage(site.name, answer),
        schema: ReputationExtractSchema,
        model: HAIKU_MODEL,
      })
      extracted = res.data
    } catch (err) {
      console.error(`[reputation] extraction ${engine.name} échouée:`, err)
      extracted = { knows_business: true, sentiment: 'neutral', claims: [] }
    }

    await createReputationResult({
      runId,
      engine: engine.name,
      answer: answer.slice(0, 8_000),
      sentiment: extracted.sentiment,
      knowsBusiness: extracted.knows_business,
      claims: extracted.claims,
    })
  }

  return {
    enginesQueried: engines.length,
    enginesAnswered,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
  }
}
