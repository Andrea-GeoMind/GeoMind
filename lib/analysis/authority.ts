// Orchestration de la phase Autorité GEO.
// Pour chaque prompt neutre du site, interroge les 4 IAs en parallèle bornée (max 8 concurrents),
// parse les citations, détecte le domaine client, stocke authority_results + authority_sources.

import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { getAnalysisById } from '@/lib/db/queries/analyses'
import { insertAuthorityResult } from '@/lib/db/queries/authority-results'
import { insertAuthoritySources } from '@/lib/db/queries/authority-sources'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { extractDomain } from '@/lib/ai/parse'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'

const MAX_CONCURRENCY = 8

// ─── Pool de concurrence simple (sans dépendance externe) ─────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++
      results[i] = await tasks[i]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker)
  await Promise.all(workers)
  return results
}

// ─── Types publics ─────────────────────────────────────────────────────────────

export interface AuthorityAnalysisResult {
  totalCalls: number
  successfulCalls: number
  totalCostUsd: number
  citationsFound: number
  clientCitationsFound: number
}

// ─── runAuthorityAnalysis ──────────────────────────────────────────────────────

export async function runAuthorityAnalysis(
  analysisId: string
): Promise<AuthorityAnalysisResult> {
  const analysis = await getAnalysisById(analysisId)
  if (!analysis) throw new Error(`Analyse introuvable : ${analysisId}`)

  const site = await getSiteById(analysis.siteId)
  if (!site) throw new Error(`Site introuvable : ${analysis.siteId}`)

  const allPrompts = await getPromptsBySiteId(analysis.siteId)
  // Seuls les prompts neutres sont utilisés pour le score (règle §6 CLAUDE.md)
  const neutralPrompts = allPrompts.filter((p) => p.isNeutral)

  if (neutralPrompts.length === 0) {
    return { totalCalls: 0, successfulCalls: 0, totalCostUsd: 0, citationsFound: 0, clientCitationsFound: 0 }
  }

  const engines: IAEngine[] = [
    new ChatGPTConnector(),
    new ClaudeConnector(),
    new GeminiConnector(),
    new PerplexityConnector(),
  ]

  const clientDomain = extractDomain(site.url)

  // Modèles réels par engine (doit rester synchronisé avec les connecteurs)
  const ENGINE_MODELS: Record<string, string> = {
    chatgpt: 'openai/gpt-4o-mini-search-preview',
    claude: 'anthropic/claude-haiku-4-5:beta',
    gemini: 'google/gemini-2.5-flash',
    perplexity: 'sonar',
  }

  // Estimation coût avant batch (règle §10 CLAUDE.md)
  logEstimatedBatchCost(
    neutralPrompts.flatMap(() =>
      engines.map((e) => ({
        model: ENGINE_MODELS[e.name] ?? 'openai/gpt-4o-mini',
        estimatedInputTokens: 200,
        estimatedOutputTokens: 400,
      }))
    )
  )

  // Construction des tâches : 1 tâche = 1 prompt × 1 IA
  type Task = { promptId: string; promptText: string; promptIsNeutral: boolean; engine: IAEngine }
  const tasks: Task[] = []
  for (const prompt of neutralPrompts) {
    for (const engine of engines) {
      tasks.push({ promptId: prompt.id, promptText: prompt.text, promptIsNeutral: prompt.isNeutral, engine })
    }
  }

  let successfulCalls = 0
  let totalCostUsd = 0
  let citationsFound = 0
  let clientCitationsFound = 0

  const runnableTasks = tasks.map((task) => async () => {
    let response: IAResponse
    try {
      response = await task.engine.query(task.promptText)
    } catch (err) {
      // Log mais ne fait pas échouer l'analyse (règle §10 + §8)
      console.error(
        `[GeoMind/authority] IA ${task.engine.name} erreur sur prompt ${task.promptId}:`,
        err
      )
      return
    }

    const result = await insertAuthorityResult({
      analysisId,
      promptId: task.promptId,
      engine: task.engine.name,
      answer: response.answer,
      promptIsNeutral: task.promptIsNeutral,
      partialResponse: response.partial_response,
      tokensInput: response.tokens_input,
      tokensOutput: response.tokens_output,
      costUsd: response.cost_usd,
    })

    const sourcesWithClientFlag = response.sources.map((src) => ({
      authorityResultId: result.id,
      url: src.url,
      title: src.title,
      domain: src.domain,
      isClientDomain: src.domain === clientDomain,
    }))

    await insertAuthoritySources(sourcesWithClientFlag)

    successfulCalls++
    totalCostUsd += response.cost_usd
    citationsFound += response.sources.length
    clientCitationsFound += sourcesWithClientFlag.filter((s) => s.isClientDomain).length
  })

  await runWithConcurrency(runnableTasks, MAX_CONCURRENCY)

  return {
    totalCalls: tasks.length,
    successfulCalls,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    citationsFound,
    clientCitationsFound,
  }
}
