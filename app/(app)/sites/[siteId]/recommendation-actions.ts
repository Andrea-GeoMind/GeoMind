'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { subscriptions, technicalIssues, contentIssues, analyses } from '@/lib/db/schema'
import { getRecommendationByIssueId, insertRecommendations } from '@/lib/db/queries/recommendations'
import { callStructured } from '@/lib/ai/structured'
import { RecommendationOutputSchema } from '@/lib/ai/schemas'
import {
  buildCompleteRecommendationSystemPrompt,
  buildCompleteRecommendationUserMessage,
} from '@/lib/ai/prompts/recommendations'
import { logEstimatedBatchCost } from '@/lib/ai/cost'

const COMPLETE_MODEL = 'anthropic/claude-sonnet-4-6'
const EST_INPUT_TOKENS = 400
const EST_OUTPUT_TOKENS = 1200

export async function generateCompleteRecommendation(
  issueId: string,
  issueType: 'technical' | 'content',
): Promise<{ content: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify Business plan
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    columns: { plan: true },
  })
  if (sub?.plan !== 'business') {
    return { error: 'La version complète est réservée au plan Business.' }
  }

  // Fetch issue and verify ownership via the analysis
  let issueRow: { title: string; description: string; ruleKey: string; analysisId: string } | undefined

  if (issueType === 'technical') {
    issueRow = await db.query.technicalIssues.findFirst({
      where: eq(technicalIssues.id, issueId),
      columns: { title: true, description: true, ruleKey: true, analysisId: true },
    })
  } else {
    issueRow = await db.query.contentIssues.findFirst({
      where: eq(contentIssues.id, issueId),
      columns: { title: true, description: true, ruleKey: true, analysisId: true },
    })
  }

  if (!issueRow) return { error: 'Issue introuvable.' }

  const analysis = await db.query.analyses.findFirst({
    where: eq(analyses.id, issueRow.analysisId),
    columns: { userId: true },
  })
  if (!analysis || analysis.userId !== user.id) return { error: 'Accès refusé.' }

  // Return cached 'complete' variant if it exists
  const existing = await getRecommendationByIssueId(issueId, 'complete')
  if (existing) return { content: existing.content }

  // Generate via Sonnet
  logEstimatedBatchCost([
    {
      model: COMPLETE_MODEL,
      estimatedInputTokens: EST_INPUT_TOKENS,
      estimatedOutputTokens: EST_OUTPUT_TOKENS,
    },
  ])

  try {
    const { data } = await callStructured({
      systemPrompt: buildCompleteRecommendationSystemPrompt(),
      userContent: buildCompleteRecommendationUserMessage({
        title: issueRow.title,
        description: issueRow.description,
        ruleKey: issueRow.ruleKey,
      }),
      schema: RecommendationOutputSchema,
      model: COMPLETE_MODEL,
    })

    await insertRecommendations([
      {
        analysisId: issueRow.analysisId,
        issueType,
        issueId,
        variant: 'complete',
        content: data.content,
      },
    ])

    return { content: data.content }
  } catch (err) {
    console.error('[generateCompleteRecommendation] error:', err)
    return { error: 'Erreur lors de la génération. Veuillez réessayer.' }
  }
}
