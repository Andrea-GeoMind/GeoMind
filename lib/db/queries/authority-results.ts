import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { authorityResults } from '@/lib/db/schema'
import type { IAEngineName } from '@/lib/ai/connectors/base'

export type AuthorityResultInsert = {
  analysisId: string
  promptId: string
  engine: IAEngineName
  answer: string
  promptIsNeutral: boolean
  partialResponse: boolean
  tokensInput: number
  tokensOutput: number
  costUsd: number
}

export async function insertAuthorityResult(data: AuthorityResultInsert) {
  const [row] = await db
    .insert(authorityResults)
    .values({ ...data, costUsd: String(data.costUsd) })
    .returning()
  return row
}

export async function getAuthorityResultsByAnalysisId(analysisId: string) {
  return db.query.authorityResults.findMany({
    where: eq(authorityResults.analysisId, analysisId),
    with: { sources: true, prompt: true },
  })
}
