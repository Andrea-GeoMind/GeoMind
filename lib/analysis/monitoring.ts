/**
 * lib/analysis/monitoring.ts
 *
 * Surveillance récurrente de la visibilité (PLAN item 12). Contrairement à une
 * analyse complète (déclenchée et payée par le client), un check de
 * surveillance est léger : un échantillon de prompts neutres × 4 moteurs, en
 * mode forcé, écrit uniquement dans citation_checks (pas d'analysis).
 * Coût interne assumé par GeoMind (~0,03-0,06 €/site/passage) — c'est le
 * moteur de la rétention, pas un service facturé en crédits.
 */

import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { insertCitationChecks } from '@/lib/db/queries/citation-checks'
import { logEstimatedBatchCost } from '@/lib/ai/cost'
import { extractDomain } from '@/lib/ai/parse'
import { CITATION_SUFFIX } from '@/lib/analysis/authority'
import { IAResponseSchema } from '@/lib/ai/schemas'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import type { IAEngine } from '@/lib/ai/connectors/base'

export interface MonitoringCheckResult {
  totalCalls: number
  successfulCalls: number
  citedCalls: number
}

/**
 * Exécute un passage de surveillance sur un site : `promptCount` prompts
 * neutres × 4 moteurs, en série (pas de pic de charge — le cron a le temps).
 */
export async function runMonitoringCheck(
  siteId: string,
  promptCount: number
): Promise<MonitoringCheckResult> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`Site introuvable : ${siteId}`)

  const allPrompts = await getPromptsBySiteId(siteId)
  const prompts = allPrompts.filter((p) => p.isNeutral).slice(0, promptCount)
  if (prompts.length === 0) {
    return { totalCalls: 0, successfulCalls: 0, citedCalls: 0 }
  }

  const engines: IAEngine[] = [
    new ChatGPTConnector(),
    new ClaudeConnector(),
    new GeminiConnector(),
    new PerplexityConnector(),
  ]

  const clientDomain = extractDomain(site.url)

  logEstimatedBatchCost(
    prompts.flatMap(() =>
      engines.map(() => ({
        model: 'openai/gpt-4o-mini',
        estimatedInputTokens: 200,
        estimatedOutputTokens: 400,
      }))
    )
  )

  let successfulCalls = 0
  let citedCalls = 0
  const totalCalls = prompts.length * engines.length

  for (const prompt of prompts) {
    for (const engine of engines) {
      try {
        const response = IAResponseSchema.parse(await engine.query(prompt.text + CITATION_SUFFIX))
        const clientIndex = response.sources.findIndex((s) => s.domain === clientDomain)
        await insertCitationChecks([
          {
            siteId,
            promptId: prompt.id,
            analysisId: null,
            engine: engine.name,
            mode: 'forced',
            cited: clientIndex >= 0,
            position: clientIndex >= 0 ? clientIndex + 1 : null,
          },
        ])
        successfulCalls++
        if (clientIndex >= 0) citedCalls++
      } catch (err) {
        console.error(`[GeoMind/monitoring] ${engine.name} erreur sur site ${siteId}:`, err)
      }
    }
  }

  return { totalCalls, successfulCalls, citedCalls }
}
