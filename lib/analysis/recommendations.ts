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

const RECOMMENDATION_MODEL = 'anthropic/claude-haiku-4-5'
const CONCURRENCY_LIMIT = 5
const EST_INPUT_TOKENS = 200
const EST_OUTPUT_TOKENS = 400

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

async function runWithPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  let i = 0

  async function worker(): Promise<void> {
    while (i < tasks.length) {
      const index = i++
      results[index] = await tasks[index]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateRecommendations(_siteId: string, analysisId: string): Promise<void> {
  const [technicalIssues, contentIssues] = await Promise.all([
    getTechnicalIssuesByAnalysisId(analysisId),
    getContentIssuesByAnalysisId(analysisId),
  ])

  const allIssues = [
    ...technicalIssues.map((i) => ({ ...i, issueType: 'technical' as const })),
    ...contentIssues.map((i) => ({ ...i, issueType: 'content' as const })),
  ]

  if (allIssues.length === 0) return

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
      })
      return { id: issue.id, type: issue.issueType, content: data.content }
    },
  )

  const results = await runWithPool(tasks, CONCURRENCY_LIMIT)
  const payloads = buildInsertPayloads(analysisId, results)
  await insertRecommendations(payloads)
}
