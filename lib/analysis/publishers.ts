// Génération des publishers par secteur via Claude Haiku (structured output).
// 15 publishers : 5 médias FR, 5 communautés, 5 bases publiques.

import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { insertPublishers, deletePublishersByAnalysisId } from '@/lib/db/queries/publishers'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { callStructured } from '@/lib/ai/structured'
import { PublishersOutputSchema } from '@/lib/ai/schemas'
import {
  PUBLISHERS_SYSTEM_PROMPT,
  buildPublishersUserMessage,
} from '@/lib/ai/prompts/publishers'

const HAIKU_MODEL = 'anthropic/claude-haiku-4-5'

export interface PublishersResult {
  count: number
  totalCostUsd: number
}

export async function detectPublishers(
  siteId: string,
  analysisId: string
): Promise<PublishersResult> {
  const [site, metadata] = await Promise.all([
    getSiteById(siteId),
    getSiteMetadataBySiteId(siteId),
  ])

  if (!site) throw new Error(`Site introuvable : ${siteId}`)
  if (!metadata) throw new Error(`Métadonnées manquantes pour le site ${siteId} — lancer la découverte d'abord`)

  logEstimatedBatchCost([
    { model: HAIKU_MODEL, estimatedInputTokens: 1_500, estimatedOutputTokens: 1_200 },
  ])

  const result = await callStructured({
    systemPrompt: PUBLISHERS_SYSTEM_PROMPT,
    userContent: buildPublishersUserMessage({
      siteName: site.name,
      siteUrl: site.url,
      description: metadata.description ?? '',
      keywords: metadata.keywords,
      sector: metadata.keywords.slice(0, 3).join(', '),
    }),
    schema: PublishersOutputSchema,
    model: HAIKU_MODEL,
  })

  // Remplace les publishers précédents pour cette analyse (idempotence)
  await deletePublishersByAnalysisId(analysisId)
  await insertPublishers(analysisId, siteId, result.data.publishers)

  const totalCostUsd =
    result.tokensInput * (0.8 / 1_000_000) + result.tokensOutput * (4.0 / 1_000_000)

  return {
    count: result.data.publishers.length,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
  }
}
