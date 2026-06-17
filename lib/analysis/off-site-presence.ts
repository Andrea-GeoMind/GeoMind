// Diagnostic de présence off-site (cœur du GEO).
//
// Pour chaque plateforme clé du registre (LinkedIn, Wikidata, Crunchbase…), on
// vérifie via recherche web (Perplexity) si le client y possède une fiche/profil.
// Résultat persisté par analyse ; alimente l'onglet « Présence off-site ».
//
// Règles CLAUDE.md respectées : appels LLM hors route (Inngest), sortie validée
// par Zod (§8), Promise.all plafonné (§10), coût loggé (§10).

import { z } from 'zod'
import { getSiteById } from '@/lib/db/queries/sites'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import { OFF_SITE_PLATFORMS } from '@/lib/analysis/offsite-platforms'
import { buildOffSitePresencePrompt } from '@/lib/ai/prompts/off-site'
import {
  insertOffSitePresence,
  deleteOffSitePresenceByAnalysisId,
  type OffSitePresenceInput,
} from '@/lib/db/queries/off-site-presence'

// Concurrence volontairement basse : recherches web séquentielles par lots pour
// ne pas saturer l'API Perplexity ni brûler du crédit (§10).
const CONCURRENCY = 4

const VerdictSchema = z.object({
  status: z.enum(['present', 'absent', 'unknown']),
  url: z.string().nullable().optional(),
  raison: z.string().optional(),
})

export interface OffSitePresenceResult {
  detected: number
  presentCount: number
  /** % des plateformes clés couvertes (présentes / total détecté) */
  coverageScore: number
  totalCostUsd: number
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') return null
  return trimmed
}

export async function detectOffSitePresence(
  siteId: string,
  analysisId: string
): Promise<OffSitePresenceResult> {
  const site = await getSiteById(siteId)
  if (!site) throw new Error(`Site introuvable : ${siteId}`)

  const connector = new PerplexityConnector()
  const results: OffSitePresenceInput[] = []
  let totalCostUsd = 0

  // Traitement par lots (concurrence plafonnée)
  for (let i = 0; i < OFF_SITE_PLATFORMS.length; i += CONCURRENCY) {
    const batch = OFF_SITE_PLATFORMS.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(
      batch.map(async (platform) => {
        const prompt = buildOffSitePresencePrompt({
          brandName: site.name,
          siteUrl: site.url,
          platformName: platform.name,
          platformDomain: platform.domain,
        })
        const res = await connector.query(prompt)
        totalCostUsd += res.cost_usd

        const jsonStr = extractJson(res.answer)
        if (!jsonStr) {
          return {
            platformId: platform.id,
            status: 'unknown' as const,
            profileUrl: null,
            evidence: null,
          }
        }
        let parsedUnknown: unknown
        try {
          parsedUnknown = JSON.parse(jsonStr)
        } catch {
          return {
            platformId: platform.id,
            status: 'unknown' as const,
            profileUrl: null,
            evidence: null,
          }
        }
        const verdict = VerdictSchema.safeParse(parsedUnknown)
        if (!verdict.success) {
          return {
            platformId: platform.id,
            status: 'unknown' as const,
            profileUrl: null,
            evidence: null,
          }
        }
        return {
          platformId: platform.id,
          status: verdict.data.status,
          profileUrl: verdict.data.status === 'present' ? normalizeUrl(verdict.data.url) : null,
          evidence: verdict.data.raison?.slice(0, 280) ?? null,
        }
      })
    )

    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results.push(s.value)
      }
      // Une plateforme qui échoue est simplement omise (pas de faux "absent").
    }
  }

  // Idempotence : on remplace les résultats précédents de cette analyse.
  await deleteOffSitePresenceByAnalysisId(analysisId)
  await insertOffSitePresence(analysisId, siteId, results)

  const presentCount = results.filter((r) => r.status === 'present').length
  const detected = results.length
  const coverageScore = detected > 0 ? Math.round((presentCount / detected) * 100) : 0

  return {
    detected,
    presentCount,
    coverageScore,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
  }
}
