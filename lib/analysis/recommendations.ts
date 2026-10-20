import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { insertRecommendations, type RecommendationInsertRow } from '@/lib/db/queries/recommendations'
import { callStructured } from '@/lib/ai/structured'
import { RecommendationOutputSchema } from '@/lib/ai/schemas'
import {
  buildRecommendationSystemPrompt,
  buildRecommendationUserMessage,
} from '@/lib/ai/prompts/recommendations'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { captureJobFailure } from '@/lib/monitoring'

const RECOMMENDATION_MODEL = 'anthropic/claude-haiku-4-5'
const CONCURRENCY_LIMIT = 5
const EST_INPUT_TOKENS = 200
const EST_OUTPUT_TOKENS = 400
// Une fiche « simplifiée » tient en ~400 tokens : 1 000 laissent de la marge
// sans laisser OpenRouter réserver le prix d'une réponse illimitée (PLAN 48).
const MAX_OUTPUT_TOKENS = 1_000

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IssueForRecommendation {
  id: string
  type: 'technical' | 'content'
  content: string
}

// ─── Pure helpers (testables) ────────────────────────────────────────────────

export function buildInsertPayloads(
  analysisId: string,
  results: IssueForRecommendation[],
): RecommendationInsertRow[] {
  return results.map((r) => ({
    analysisId,
    issueType: r.type,
    issueId: r.id,
    variant: 'simplified',
    content: r.content,
  }))
}

// ─── Pool helper ─────────────────────────────────────────────────────────────

export type PoolOutcome<T> = { ok: true; value: T } | { ok: false; error: unknown }

/**
 * Pool borné qui isole chaque tâche (PLAN 48). Avant, une seule fiche refusée
 * par OpenRouter (402) faisait rejeter tout le pool, puis toute l'analyse,
 * alors que les réponses IA, la technique et le contenu étaient déjà en base.
 */
export async function runWithPool<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PoolOutcome<T>[]> {
  const results: PoolOutcome<T>[] = []
  let i = 0

  async function worker(): Promise<void> {
    while (i < tasks.length) {
      const index = i++
      try {
        results[index] = { ok: true, value: await tasks[index]!() }
      } catch (error) {
        results[index] = { ok: false, error }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

export interface RecommendationsOutcome {
  generated: number
  /** Points faibles restés sans fiche : l'interface les affiche sans recommandation. */
  failedIssueIds: string[]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateRecommendations(
  _siteId: string,
  analysisId: string
): Promise<RecommendationsOutcome> {
  const [technicalIssues, contentIssues] = await Promise.all([
    getTechnicalIssuesByAnalysisId(analysisId),
    getContentIssuesByAnalysisId(analysisId),
  ])

  const allIssues = [
    ...technicalIssues.map((i) => ({ ...i, issueType: 'technical' as const })),
    ...contentIssues.map((i) => ({ ...i, issueType: 'content' as const })),
  ]

  if (allIssues.length === 0) return { generated: 0, failedIssueIds: [] }

  logEstimatedBatchCost(
    allIssues.map(() => ({
      model: RECOMMENDATION_MODEL,
      estimatedInputTokens: EST_INPUT_TOKENS,
      estimatedOutputTokens: EST_OUTPUT_TOKENS,
    })),
  )

  const systemPrompt = buildRecommendationSystemPrompt()

  const tasks = allIssues.map(
    (issue) => async (): Promise<IssueForRecommendation> => {
      const { data } = await callStructured({
        systemPrompt,
        userContent: buildRecommendationUserMessage({
          title: issue.title,
          description: issue.description,
          ruleKey: issue.ruleKey,
        }),
        schema: RecommendationOutputSchema,
        model: RECOMMENDATION_MODEL,
        maxTokens: MAX_OUTPUT_TOKENS,
      })
      return { id: issue.id, type: issue.issueType, content: data.content }
    },
  )

  const outcomes = await runWithPool(tasks, CONCURRENCY_LIMIT)
  const results = outcomes.flatMap((o) => (o.ok ? [o.value] : []))
  const failedIssueIds = outcomes.flatMap((o, i) => (o.ok ? [] : [allIssues[i]!.id]))

  if (results.length > 0) await insertRecommendations(buildInsertPayloads(analysisId, results))

  if (failedIssueIds.length > 0) {
    const firstError = outcomes.find((o) => !o.ok)
    console.error(
      `[GeoMind/recommendations] ${failedIssueIds.length}/${allIssues.length} fiches non générées (analyse ${analysisId})`
    )
    captureJobFailure(
      'recommendations',
      firstError && !firstError.ok ? firstError.error : 'échec inconnu',
      { analysisId, failed: failedIssueIds.length, total: allIssues.length }
    )
  }

  return { generated: results.length, failedIssueIds }
}
