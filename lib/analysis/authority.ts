// Orchestration de la phase Autorité GEO.
// Pour chaque prompt neutre du site, interroge tous les moteurs en parallèle bornée (max 8 concurrents),
// parse les citations, détecte le domaine client, stocke authority_results + authority_sources.

import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { getAnalysisById } from '@/lib/db/queries/analyses'
import { insertAuthorityResult } from '@/lib/db/queries/authority-results'
import { insertAuthoritySources } from '@/lib/db/queries/authority-sources'
import { insertCitationChecks } from '@/lib/db/queries/citation-checks'
import {
  insertAuthorityFailures,
  type AuthorityFailureInsert,
} from '@/lib/db/queries/authority-failures'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { extractDomain } from '@/lib/ai/parse'
import { createEngines, ENGINE_MODELS } from '@/lib/ai/engines'
import type { IAEngine, IAEngineName, IAResponse } from '@/lib/ai/connectors/base'
import { IAResponseSchema } from '@/lib/ai/schemas'
import { captureEngineFailure, captureEngineOutage } from '@/lib/monitoring'

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

// Analyse offerte (plan gratuit) : on garde tous les moteurs mais on limite à 3 questions
// et on saute le mode spontané (la 2ᵉ salve), ce qui divise le coût API par ~4.
// Les plans payants (et admin) gardent l'analyse complète.
const FREE_TIER_FORCED_PROMPTS = 3

// ─── Pool de concurrence simple (sans dépendance externe) ─────────────────────

/**
 * Pool de concurrence. Une tâche qui lève ne doit pas vider la file.
 *
 * Avant : `results[i] = await tasks[i]()` sans garde. La première exception
 * faisait rejeter `Promise.all`, la fonction rendait la main pendant que les
 * autres workers continuaient en arrière-plan, et leurs écritures atterrissaient
 * après coup. On isole donc chaque tâche : elle est responsable de son propre
 * échec, le pool se contente de vider la file.
 */
async function runWithConcurrency(
  tasks: (() => Promise<void>)[],
  limit: number
): Promise<void> {
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++
      try {
        await tasks[i]!()
      } catch (err) {
        // Une tâche gère déjà ses erreurs attendues ; ici on rattrape
        // l'imprévu (écriture en base, par exemple) sans perdre le reste.
        console.error('[GeoMind/authority] tâche abandonnée :', err)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
}

/** Tentatives par appel IA, la première incluse. */
const MAX_ATTEMPTS = 3

/** Attente avant la n-ième reprise : 1 s, puis 3 s. */
export const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Vrai pour les erreurs qui valent une reprise : saturation, quota, panne
 * passagère, coupure réseau. Un refus du modèle ou une réponse malformée ne
 * changera pas au deuxième essai.
 */
export function isRetryableEngineError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /\b(429|408|409|425|500|502|503|504)\b|rate.?limit|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|overloaded|capacity/i.test(
    message
  )
}

/** Motif court, borné, lisible dans l'interface. */
export function failureReason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/\s+/g, ' ').trim().slice(0, 300)
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
  /**
   * Nombre de RÉPONSES citant le domaine client — pas de sources.
   *
   * Comptait auparavant les sources : une réponse citant deux pages du domaine
   * pesait double, et le score dépassait le taux de citation réel (41 au lieu
   * de 38 sur l'analyse du 15/09/2026). Le dénominateur, lui, a toujours été
   * un nombre de réponses : les deux unités doivent concorder.
   */
  clientCitationsFound: number
  /** Appels du mode forcé qui n'ont pas abouti, toutes reprises épuisées. */
  failedCalls: number
  /** Questions dont aucun moteur n'a répondu — elles rendent l'analyse incomplète. */
  unansweredPromptIds: string[]
}

// ─── runAuthorityAnalysis ──────────────────────────────────────────────────────

export async function runAuthorityAnalysis(
  analysisId: string,
  options: {
    tier?: 'free' | 'full'
    /** Attentes entre reprises. Réglable pour les tests et pour le réglage fin. */
    retryDelaysMs?: number[]
  } = {}
): Promise<AuthorityAnalysisResult> {
  const tier = options.tier ?? 'full'
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS
  const analysis = await getAnalysisById(analysisId)
  if (!analysis) throw new Error(`Analyse introuvable : ${analysisId}`)

  const site = await getSiteById(analysis.siteId)
  if (!site) throw new Error(`Site introuvable : ${analysis.siteId}`)

  const allPrompts = await getPromptsBySiteId(analysis.siteId)
  // Seuls les prompts neutres sont utilisés pour le score (règle §6 CLAUDE.md)
  const allNeutralPrompts = allPrompts.filter((p) => p.isNeutral)
  // Plan gratuit : 3 questions max (cf. FREE_TIER_FORCED_PROMPTS). Payants : toutes.
  const neutralPrompts =
    tier === 'free'
      ? allNeutralPrompts.slice(0, FREE_TIER_FORCED_PROMPTS)
      : allNeutralPrompts

  if (neutralPrompts.length === 0) {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      spontaneousSuccessfulCalls: 0,
      totalCostUsd: 0,
      citationsFound: 0,
      clientCitationsFound: 0,
      failedCalls: 0,
      unansweredPromptIds: [],
    }
  }

  const engines = createEngines()

  const clientDomain = extractDomain(site.url)

  // Plan gratuit : pas de 2ᵉ salve « spontanée » (mesure de citation naturelle) —
  // c'est elle qui re-pose les questions une seconde fois. Payants : conservée.
  const spontaneousPrompts =
    tier === 'free' ? [] : neutralPrompts.slice(0, SPONTANEOUS_SAMPLE_SIZE)

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
  /** Échecs par moteur — sert à distinguer une panne d'un aléa réseau isolé. */
  const failuresByEngine = new Map<IAEngineName, number>()
  /** Échecs persistés en fin de salve, pour que l'interface puisse les montrer. */
  const failures: AuthorityFailureInsert[] = []
  /** Questions ayant obtenu au moins une réponse en mode forcé. */
  const answeredPromptIds = new Set<string>()

  const runnableTasks = tasks.map((task) => async () => {
    let response: IAResponse | null = null
    let lastError: unknown
    let attempts = 0

    // Reprise sur erreur passagère. Sans elle, une fenêtre de saturation
    // emportait des questions entières : les tâches sont ordonnées par
    // question et MAX_CONCURRENCY vaut 8, soit exactement 2 questions × 4
    // moteurs en vol — d'où les deux questions perdues d'un coup le 15/09.
    while (attempts < MAX_ATTEMPTS) {
      attempts++
      try {
        const raw = await task.engine.query(task.promptText)
        // Validation runtime (règle §8) — une réponse malformée = appel échoué
        response = IAResponseSchema.parse(raw)
        break
      } catch (err) {
        lastError = err
        if (attempts >= MAX_ATTEMPTS || !isRetryableEngineError(err)) break
        await sleep(retryDelaysMs[attempts - 1] ?? retryDelaysMs.at(-1) ?? 0)
      }
    }

    if (response === null) {
      // Log mais ne fait pas échouer l'analyse (règle §10 + §8)
      console.error(
        `[GeoMind/authority] IA ${task.engine.name} erreur sur prompt ${task.promptId} ` +
          `après ${attempts} tentative(s) :`,
        lastError
      )
      captureEngineFailure(task.engine.name, lastError, {
        step: 'authority',
        analysisId,
        promptId: task.promptId,
      })
      failuresByEngine.set(task.engine.name, (failuresByEngine.get(task.engine.name) ?? 0) + 1)
      failures.push({
        analysisId,
        promptId: task.promptId,
        engine: task.engine.name,
        mode: task.mode,
        reason: failureReason(lastError),
        attempts,
      })
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
      // Une réponse citant trois pages du domaine reste UNE citation : le
      // dénominateur compte des réponses, le numérateur doit en faire autant.
      if (clientIndex >= 0) clientCitationsFound++
      answeredPromptIds.add(task.promptId)
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

  // Les échecs sont écrits en une fois, après la salve : l'interface et le
  // rapport s'en servent pour dire ce qui manque plutôt que de le taire.
  if (failures.length > 0) {
    try {
      await insertAuthorityFailures(failures)
    } catch (err) {
      console.error('[GeoMind/authority] échecs non persistés :', err)
    }
  }

  // Un moteur qui a raté 100 % de ses appels est en panne, pas victime du réseau.
  for (const [engineName, failed] of failuresByEngine) {
    captureEngineOutage(engineName, {
      attempted: tasks.filter((t) => t.engine.name === engineName).length,
      failed,
      step: 'authority',
      analysisId,
    })
  }

  const unansweredPromptIds = neutralPrompts
    .map((p) => p.id)
    .filter((id) => !answeredPromptIds.has(id))

  return {
    totalCalls: tasks.length,
    successfulCalls,
    spontaneousSuccessfulCalls,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    citationsFound,
    clientCitationsFound,
    failedCalls: failures.filter((f) => f.mode === 'forced').length,
    unansweredPromptIds,
  }
}
