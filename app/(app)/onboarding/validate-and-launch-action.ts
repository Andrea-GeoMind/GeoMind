'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { upsertSiteMetadata } from '@/lib/db/queries/site-metadata'
import { CREDIT_COSTS, consumeCredits, refundCredits } from '@/lib/credits'
import { createAnalysis, updateAnalysisStatus } from '@/lib/db/queries/analyses'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'
import { db } from '@/lib/db/client'
import { competitors, prompts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type DiscoveryEdits = {
  description: string
  keywords: string[]
  competitors: { url: string; name: string }[]
  prompts: { text: string }[]
}

export async function validateAndLaunchAction(
  siteId: string,
  edits: DiscoveryEdits
): Promise<{ error: string } | { analysisId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  // Décompte ATOMIQUE au lancement (PLAN item 17) — pas un simple check :
  // la réservation évite la course entre vérification et consommation, et
  // l'échec technique est remboursé automatiquement (ici ou dans le job).
  const consumed = await consumeCredits(user.id, CREDIT_COSTS.fullAnalysis, 'analysis', {
    siteId,
    source: 'onboarding',
  })
  if (!consumed.ok) {
    return {
      error: `Crédits insuffisants : une analyse complète coûte ${CREDIT_COSTS.fullAnalysis} crédits (solde : ${consumed.balance.total}).`,
    }
  }

  // Sauvegarder les modifications
  await upsertSiteMetadata({
    siteId,
    description: edits.description,
    keywords: edits.keywords,
  })

  // Remplacer concurrents
  await db.delete(competitors).where(eq(competitors.siteId, siteId))
  if (edits.competitors.length > 0) {
    await db.insert(competitors).values(
      edits.competitors
        .filter((c) => c.url.trim())
        .map((c) => ({ siteId, url: c.url.trim(), name: c.name.trim() || null }))
    )
  }

  // Remplacer prompts
  await db.delete(prompts).where(eq(prompts.siteId, siteId))
  if (edits.prompts.length > 0) {
    await db.insert(prompts).values(
      edits.prompts
        .filter((p) => p.text.trim())
        .map((p) => ({ siteId, text: p.text.trim(), isNeutral: true }))
    )
  }

  // Créer l'analyse + émettre l'événement Inngest
  let analysis
  try {
    analysis = await createAnalysis({ siteId, userId: user.id })
  } catch (err) {
    console.error('[validateAndLaunchAction] DB error:', err)
    await refundCredits(user.id, CREDIT_COSTS.fullAnalysis, { siteId, step: 'createAnalysis' })
    return { error: 'Une erreur est survenue. Réessayez.' }
  }

  trackEvent(user.id, 'analysis_started', { siteId, analysisId: analysis.id })

  try {
    await inngest.send({
      name: 'analysis.full.requested',
      data: { analysisId: analysis.id, siteId, userId: user.id },
    })
  } catch (err) {
    console.error('[Inngest] Failed to send analysis event:', err)
    await Promise.all([
      refundCredits(user.id, CREDIT_COSTS.fullAnalysis, {
        siteId,
        analysisId: analysis.id,
        step: 'inngest.send',
      }),
      updateAnalysisStatus(analysis.id, 'error', 'Échec du lancement du job'),
    ])
    return { error: "Erreur lors du lancement de l'analyse. Réessayez." }
  }

  return { analysisId: analysis.id }
}
