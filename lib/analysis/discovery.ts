// Orchestration de la phase de découverte GEO.
// Prend les pages crawlées d'un site, appelle Claude Haiku 2x via callStructured,
// valide par Zod, détecte les prompts non-neutres (règle §6), stocke en DB.

import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { getSiteById } from '@/lib/db/queries/sites'
import { upsertSiteMetadata } from '@/lib/db/queries/site-metadata'
import { replaceCompetitors } from '@/lib/db/queries/competitors'
import { replacePrompts } from '@/lib/db/queries/prompts'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { callStructured } from '@/lib/ai/structured'
import { DiscoveryOutputSchema, NeutralPromptsOutputSchema } from '@/lib/ai/schemas'
import {
  DISCOVERY_SYSTEM_PROMPT,
  buildDiscoveryUserMessage,
} from '@/lib/ai/prompts/discovery'
import {
  NEUTRAL_PROMPTS_SYSTEM_PROMPT,
  buildNeutralPromptsUserMessage,
} from '@/lib/ai/prompts/neutral-prompts'
import { isPromptNeutral } from '@/lib/analysis/neutrality'

const HAIKU_MODEL = 'anthropic/claude-haiku-4-5'

// ─── Types publics ─────────────────────────────────────────────────────────────

export interface DiscoveryResult {
  description: string
  keywords: string[]
  competitorsCount: number
  promptsCount: number
  neutralPromptsCount: number
  totalCostUsd: number
}

// ─── runDiscovery ──────────────────────────────────────────────────────────────

export async function runDiscovery(siteId: string): Promise<DiscoveryResult> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`Site introuvable : ${siteId}`)

  const pages = await getFirecrawlPagesBySiteId(siteId)
  if (pages.length === 0) throw new Error(`Aucune page crawlée pour le site ${siteId}`)

  // Estimation du coût avant appel (règle CLAUDE.md §10)
  logEstimatedBatchCost([
    { model: HAIKU_MODEL, estimatedInputTokens: 4_000, estimatedOutputTokens: 500 },
    { model: HAIKU_MODEL, estimatedInputTokens: 500, estimatedOutputTokens: 600 },
  ])

  // ── Étape 1 : extraction description / mots-clés / concurrents ────────────────

  const discoveryResult = await callStructured({
    systemPrompt: DISCOVERY_SYSTEM_PROMPT,
    userContent: buildDiscoveryUserMessage(pages),
    schema: DiscoveryOutputSchema,
    model: HAIKU_MODEL,
  })

  const { description, keywords, competitors } = discoveryResult.data

  // ── Étape 2 : génération des 20 prompts neutres ───────────────────────────────

  const neutralPromptsResult = await callStructured({
    systemPrompt: NEUTRAL_PROMPTS_SYSTEM_PROMPT,
    userContent: buildNeutralPromptsUserMessage({
      description,
      keywords,
      siteName: site.name,
      siteUrl: site.url,
    }),
    schema: NeutralPromptsOutputSchema,
    model: HAIKU_MODEL,
  })

  const rawPrompts = neutralPromptsResult.data.prompts

  // ── Étape 3 : détection des prompts non-neutres (règle CLAUDE.md §6) ──────────

  const promptsWithNeutrality = rawPrompts.map((text) => ({
    siteId,
    text,
    isNeutral: isPromptNeutral(text, site.url, site.name),
  }))

  const nonNeutralCount = promptsWithNeutrality.filter((p) => !p.isNeutral).length
  if (nonNeutralCount > 0) {
    console.warn(
      `[GeoMind/discovery] ⚠️ ${nonNeutralCount} prompt(s) non-neutre(s) détecté(s) pour le site ${siteId}`
    )
  }

  // ── Étape 4 : persistance ─────────────────────────────────────────────────────

  await upsertSiteMetadata({ siteId, description, keywords })

  await replaceCompetitors(
    siteId,
    competitors.map((c) => ({ siteId, url: c.url, name: c.name }))
  )

  await replacePrompts(siteId, promptsWithNeutrality)

  const totalCostUsd =
    discoveryResult.tokensInput * (0.8 / 1_000_000) +
    discoveryResult.tokensOutput * (4.0 / 1_000_000) +
    neutralPromptsResult.tokensInput * (0.8 / 1_000_000) +
    neutralPromptsResult.tokensOutput * (4.0 / 1_000_000)

  return {
    description,
    keywords,
    competitorsCount: competitors.length,
    promptsCount: promptsWithNeutrality.length,
    neutralPromptsCount: promptsWithNeutrality.filter((p) => p.isNeutral).length,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
  }
}

