'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { createAnalysis, updateAnalysisStatus } from '@/lib/db/queries/analyses'
import { CREDIT_COSTS, consumeCredits, refundCredits, getUserCredits } from '@/lib/credits'
import { isSiteFrozen } from '@/lib/quotas'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'

/**
 * Aperçu du coût avant lancement (§17.6 : confirmation avant dépense ≥ 100 crédits).
 * balanceAfter = null si solde illimité (admin).
 */
export async function getAnalysisCostPreviewAction(): Promise<
  { error: string } | { cost: number; balance: number | null; balanceAfter: number | null }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const credits = await getUserCredits(user.id)
    if (!Number.isFinite(credits.total)) {
      return { cost: CREDIT_COSTS.fullAnalysis, balance: null, balanceAfter: null }
    }
    return {
      cost: CREDIT_COSTS.fullAnalysis,
      balance: credits.total,
      balanceAfter: credits.total - CREDIT_COSTS.fullAnalysis,
    }
  } catch (err) {
    console.error('[getAnalysisCostPreviewAction] DB error:', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}

export async function runAnalysisAction(
  siteId: string
): Promise<{ error: string } | { analysisId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let site
  try {
    site = await getSiteById(siteId)
  } catch (err) {
    console.error('[runAnalysisAction] DB error:', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  // Site gelé après downgrade (§17.5) : lecture seule, pas de nouvelle analyse
  if (await isSiteFrozen(user.id, siteId)) {
    return {
      error:
        'Ce site est gelé : votre plan actuel ne couvre plus tous vos sites. Passez à un plan supérieur ou supprimez un site pour le réactiver.',
    }
  }

  // Décompte au lancement (§17.4) — remboursé automatiquement si l'analyse
  // échoue techniquement (ici ou dans run-full-analysis).
  const consumed = await consumeCredits(user.id, CREDIT_COSTS.fullAnalysis, 'analysis', {
    siteId,
  })
  if (!consumed.ok) {
    return {
      error: `Crédits insuffisants : une analyse complète coûte ${CREDIT_COSTS.fullAnalysis} crédits (solde : ${consumed.balance.total}). Rechargez vos crédits ou passez à un plan supérieur.`,
    }
  }

  let analysis
  try {
    analysis = await createAnalysis({ siteId, userId: user.id })
  } catch (err) {
    console.error('[runAnalysisAction] DB error:', err)
    await refundCredits(user.id, CREDIT_COSTS.fullAnalysis, { siteId, step: 'createAnalysis' })
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
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
    return {
      error: "Une erreur est survenue lors du lancement de l'analyse. Veuillez réessayer.",
    }
  }

  return { analysisId: analysis.id }
}
