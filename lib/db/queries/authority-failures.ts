import { eq, sql as raw } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { authorityFailures, prompts } from '@/lib/db/schema'
import type { IAEngineName } from '@/lib/ai/connectors/base'

export type AuthorityFailureInsert = {
  analysisId: string
  promptId: string
  engine: IAEngineName
  mode: 'forced' | 'spontaneous'
  reason: string
  attempts: number
}

export async function insertAuthorityFailures(items: AuthorityFailureInsert[]) {
  if (items.length === 0) return []
  return db.insert(authorityFailures).values(items).returning()
}

export async function getAuthorityFailuresByAnalysisId(analysisId: string) {
  return db
    .select()
    .from(authorityFailures)
    .where(eq(authorityFailures.analysisId, analysisId))
}

export interface UnansweredPrompt {
  promptId: string
  text: string
  /** Moteurs qui n'ont pas répondu, pour cette question. */
  engines: string[]
  /** Motif du premier échec — suffit à distinguer une panne d'un refus. */
  reason: string
}

/**
 * Questions du mode « forcé » qu'aucun moteur n'a pu traiter.
 *
 * C'est le seul cas qui rend l'analyse incomplète au sens du client : une
 * question qui a obtenu trois réponses sur quatre reste mesurée, une question
 * sans aucune réponse ne l'est pas du tout et ne doit pas peser dans le score
 * comme si elle avait été posée.
 */
export async function getUnansweredPrompts(analysisId: string): Promise<UnansweredPrompt[]> {
  const rows = await db
    .select({
      promptId: authorityFailures.promptId,
      text: prompts.text,
      engine: authorityFailures.engine,
      reason: authorityFailures.reason,
    })
    .from(authorityFailures)
    .innerJoin(prompts, eq(prompts.id, authorityFailures.promptId))
    .where(
      raw`${authorityFailures.analysisId} = ${analysisId}
          and ${authorityFailures.mode} = 'forced'
          and not exists (
            select 1 from authority_results r
            where r.analysis_id = ${analysisId}
              and r.prompt_id = ${authorityFailures.promptId}
          )`
    )

  const byPrompt = new Map<string, UnansweredPrompt>()
  for (const r of rows) {
    const entry = byPrompt.get(r.promptId)
    if (entry) {
      if (!entry.engines.includes(r.engine)) entry.engines.push(r.engine)
    } else {
      byPrompt.set(r.promptId, {
        promptId: r.promptId,
        text: r.text,
        engines: [r.engine],
        reason: r.reason,
      })
    }
  }
  return [...byPrompt.values()]
}
