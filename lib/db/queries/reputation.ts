/**
 * lib/db/queries/reputation.ts — accès DB de l'analyse de réputation (item 31).
 */

import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { reputationRuns, reputationResults } from '@/lib/db/schema'
import type { IAEngineName } from '@/lib/ai/connectors/base'
import type { Sentiment } from '@/lib/analysis/reputation'

export interface ReputationResultRow {
  runId: string
  engine: IAEngineName
  answer: string
  sentiment: Sentiment
  knowsBusiness: boolean
  claims: { type: string; value: string }[]
  /** Forme brute renvoyée par l'extraction (compat runner) */
  extract?: { knows_business: boolean; sentiment: Sentiment; claims: { type: string; value: string }[] }
}

export async function createReputationRun(siteId: string, userId: string): Promise<string> {
  const [row] = await db
    .insert(reputationRuns)
    .values({ siteId, userId, status: 'pending' })
    .returning({ id: reputationRuns.id })
  return row.id
}

export async function updateReputationRunStatus(
  runId: string,
  status: 'pending' | 'running' | 'success' | 'error',
  errorMessage?: string
): Promise<void> {
  await db
    .update(reputationRuns)
    .set({ status, errorMessage: errorMessage ?? null, updatedAt: new Date() })
    .where(eq(reputationRuns.id, runId))
}

export async function createReputationResult(r: {
  runId: string
  engine: IAEngineName
  answer: string
  sentiment: Sentiment
  knowsBusiness: boolean
  claims: { type: string; value: string }[]
}): Promise<void> {
  await db.insert(reputationResults).values({
    runId: r.runId,
    engine: r.engine,
    answer: r.answer,
    // 'unknown' n'est jamais produit par l'extraction (enum LLM = pos/neu/neg) mais
    // le type Sentiment l'inclut — sécurise le cast.
    sentiment: r.sentiment === 'unknown' ? 'neutral' : r.sentiment,
    knowsBusiness: r.knowsBusiness,
    claims: r.claims,
  })
}

/** Dernier run d'un site avec ses résultats. */
export async function getLatestReputationRun(siteId: string) {
  const [run] = await db
    .select()
    .from(reputationRuns)
    .where(eq(reputationRuns.siteId, siteId))
    .orderBy(desc(reputationRuns.createdAt))
    .limit(1)
  if (!run) return null

  const results = await db
    .select()
    .from(reputationResults)
    .where(eq(reputationResults.runId, run.id))

  return { run, results }
}

export async function getReputationRunById(runId: string) {
  const [run] = await db.select().from(reputationRuns).where(eq(reputationRuns.id, runId)).limit(1)
  return run ?? null
}
