// Orchestration de la phase Autorité GEO.
// Pour chaque prompt neutre du site, interroge les 4 IAs en parallèle bornée (max 8 concurrents),
// parse les citations, détecte le domaine client, stocke authority_results + authority_sources.

import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { getAnalysisById } from '@/lib/db/queries/analyses'
import { insertAuthorityResult } from '@/lib/db/queries/authority-results'
import { insertAuthoritySources } from '@/lib/db/queries/authority-sources'
import { insertCitationChecks } from '@/lib/db/queries/citation-checks'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { extractDomain } from '@/lib/ai/parse'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { IAResponseSchema } from '@/lib/ai/schemas'

const MAX_CONCURRENCY = 8

// Suffixe ajouté à chaque prompt en mode « forcé » au moment de l'envoi aux
// LLMs. Force un format liste avec URLs, sans modifier le prompt stocké en DB
// (qui reste neutre). Partagé avec la surveillance (lib/analysis/monitoring.ts).
export const CITATION_SUFFIX =
  "\n\nIMPORTANT : ta réponse doit impérativement lister au moins 10 acteurs différents (entreprises, outils ou prestataires), chacun accompagné de son site web officiel (URL complète)."

// PLAN item 10 — double mesure :
// - mode « forcé » (tous les prompts) : suffixe « liste ≥10 acteurs » → réponses
//   exploitables et comparables, alimente le score et le tableau de citations ;
// - mode « spontané » (échantillon) : le prompt brut, tel qu'un vrai client le
//   poserait → mesure la citation naturelle, sans artifice. Plus coûteux et plus
//   bruité, donc limité à un échantillon, stocké en citation_checks uniquement.
const SPONTANEOUS_SAMPLE_SIZE = 3

// Mode test (comptes admin) : analyse volontairement minimale pour ne pas brûler
// de crédit API en QA. 1 moteur éco (Gemini Flash) × N prompts, aucun spontané.
// Les vrais plans clients gardent toujours les 4 moteurs et tous les prompts.
const LITE_FORCED_PROMPTS = 2

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
  /** Appels réussis en mode forcé — dénominateur du score d'autorité */
  successfulCalls: number
  /** Appels réussis en mode spontané (échantillon, série temporelle seulement) */
  spontaneousSuccessfulCalls: number
  totalCostUsd: number
  citationsFound: number
  clientCitationsFound: number
}

// ─── runAuthorityAnalysis ──────────────────────────────────────────────────────

export async function runAuthorityAnalysis(
  analysisId: string,
  options: { lite?: boolean } = {}
): Promise<AuthorityAnalysisResult> {
  const lite = options.lite ?? false
  const analysis = await getAnalysisById(analysisId)
  if (!analysis) throw new Error(`Analyse introuvable : ${analysisId}`)

  const site = await getSiteById(analysis.siteId)
  if (!site) throw new Error(`Site introuvable : ${analysis.siteId}`)

  const allPrompts = await getPromptsBySiteId(analysis.siteId)
  // Seuls les prompts neutres sont utilisés pour le score (règle §6 CLAUDE.md)
  const allNeutralPrompts = allPrompts.filter((p) => p.isNeutral)
  // Mode test : on n'interroge que les premiers prompts (cf. LITE_FORCED_PROMPTS)
  const neutralPrompts = lite
    ? allNeutralPrompts.slice(0, LITE_FORCED_PROMPTS)
    : allNeutralPrompts

  if (neutralPrompts.length === 0) {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      spontaneousSuccessfulCalls: 0,
      totalCostUsd: 0,
      citationsFound: 0,
      clientCitationsFound: 0,
    }
  }

  // Mode test : 1 seul moteur éco (Gemini Flash) suffit à valider le pipeline.
  const engines: IAEngine[] = lite
    ? [new GeminiConnector()]
    : [
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

  // Aucun mode spontané en test (il double le nombre d'appels).
  const spontaneousPrompts = lite ? [] : neutralPrompts.slice(0, SPONTANEOUS_SAMPLE_SIZE)

  // Estimation coût avant batch (règle §10 CLAUDE.md) — forcé + spontané
  logEstimatedBatchCost(
    [...neutralPrompts, ...spontaneousPrompts].flatMap(() =>
      engines.map((e) => ({
        model: ENGINE_MODELS[e.name] ?? 'openai/gpt-4o-mini',
        estimatedInputTokens: 200,
        estimatedOutputTokens: 400,
      }))
    )
  )

  // Construction des tâches : 1 tâche = 1 prompt × 1 IA × 1 mode
  type Task = {
    promptId: string
    promptText: string
    promptIsNeutral: boolean
    engine: IAEngine
    mode: 'forced' | 'spontaneous'
  }
  const tasks: Task[] = []
  for (const prompt of neutralPrompts) {
    for (const engine of engines) {
      tasks.push({
        promptId: prompt.id,
        promptText: prompt.text + CITATION_SUFFIX,
        promptIsNeutral: prompt.isNeutral,
        engine,
        mode: 'forced',
      })
    }
  }
  for (const prompt of spontaneousPrompts) {
    for (const engine of engines) {
      tasks.push({
        promptId: prompt.id,
        promptText: prompt.text, // brut, sans suffixe — la vraie question client
        promptIsNeutral: prompt.isNeutral,
        engine,
        mode: 'spontaneous',
      })
    }
  }

  let successfulCalls = 0
  let spontaneousSuccessfulCalls = 0
  let totalCostUsd = 0
  let citationsFound = 0
  let clientCitationsFound = 0

  const runnableTasks = tasks.map((task) => async () => {
    let response: IAResponse
    try {
      const raw = await task.engine.query(task.promptText)
      // Validation runtime (règle §8) — une réponse malformée = appel échoué
      response = IAResponseSchema.parse(raw)
    } catch (err) {
      // Log mais ne fait pas échouer l'analyse (règle §10 + §8)
      console.error(
        `[GeoMind/authority] IA ${task.engine.name} erreur sur prompt ${task.promptId}:`,
        err
      )
      return
    }

    const clientIndex = response.sources.findIndex((src) => src.domain === clientDomain)

    // Le mode forcé alimente le score et le tableau de citations (UI) ;
    // le mode spontané n'alimente que la série temporelle (citation_checks).
    if (task.mode === 'forced') {
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
      citationsFound += response.sources.length
      clientCitationsFound += sourcesWithClientFlag.filter((s) => s.isClientDomain).length
    }

    // Série temporelle (PLAN item 11) : chaque appel devient un point de
    // mesure daté — la matière première des tendances et des alertes.
    await insertCitationChecks([
      {
        siteId: analysis.siteId,
        promptId: task.promptId,
        analysisId,
        engine: task.engine.name,
        mode: task.mode,
        cited: clientIndex >= 0,
        position: clientIndex >= 0 ? clientIndex + 1 : null,
      },
    ])

    if (task.mode === 'forced') {
      successfulCalls++
    } else {
      spontaneousSuccessfulCalls++
    }
    totalCostUsd += response.cost_usd
  })

  await runWithConcurrency(runnableTasks, MAX_CONCURRENCY)

  return {
    totalCalls: tasks.length,
    successfulCalls,
    spontaneousSuccessfulCalls,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    citationsFound,
    clientCitationsFound,
  }
}
