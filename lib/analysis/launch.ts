import { getSiteById } from '@/lib/db/queries/sites'
import { createAnalysis, updateAnalysisStatus } from '@/lib/db/queries/analyses'
import { CREDIT_COSTS, consumeCredits, refundCredits } from '@/lib/credits'
import { isSiteFrozen } from '@/lib/quotas'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'

/**
 * Lancement d'une analyse complète — logique partagée.
 *
 * Extrait de la Server Action pour être appelable aussi depuis le parcours de
 * rattachement d'audit express (/claim), qui déclenche l'analyse sans clic.
 * Toutes les garanties restent ici et à un seul endroit : appartenance du site,
 * site gelé, débit des crédits, remboursement si la création ou l'envoi échoue.
 *
 * L'événement `analysis.full.requested` déclenche `run-full-analysis`, qui
 * enchaîne crawl → découverte → autorité → technique → contenu : il n'y a donc
 * pas de découverte à lancer séparément (cf. règle métier 13).
 */
export type LaunchResult = { error: string; reason?: 'credits' } | { analysisId: string }

export async function launchFullAnalysis(userId: string, siteId: string): Promise<LaunchResult> {
  let site
  try {
    site = await getSiteById(siteId)
  } catch (err) {
    console.error('[launchFullAnalysis] DB error:', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
  if (!site || site.userId !== userId) return { error: 'Site introuvable.' }

  // Site gelé après downgrade (§17.5) : lecture seule, pas de nouvelle analyse
  if (await isSiteFrozen(userId, siteId)) {
    return {
      error:
        'Ce site est gelé : votre plan actuel ne couvre plus tous vos sites. Passez à un plan supérieur ou supprimez un site pour le réactiver.',
    }
  }

  // Décompte au lancement (§17.4) — remboursé automatiquement si l'analyse
  // échoue techniquement (ici ou dans run-full-analysis).
  const consumed = await consumeCredits(userId, CREDIT_COSTS.fullAnalysis, 'analysis', { siteId })
  if (!consumed.ok) {
    return {
      reason: 'credits',
      error: `Crédits insuffisants : une analyse complète coûte ${CREDIT_COSTS.fullAnalysis} crédits (solde : ${consumed.balance.total}). Rechargez vos crédits ou passez à un plan supérieur.`,
    }
  }

  let analysis
  try {
    analysis = await createAnalysis({ siteId, userId })
  } catch (err) {
    console.error('[launchFullAnalysis] DB error:', err)
    await refundCredits(userId, CREDIT_COSTS.fullAnalysis, { siteId, step: 'createAnalysis' })
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }

  trackEvent(userId, 'analysis_started', { siteId, analysisId: analysis.id })

  try {
    await inngest.send({
      name: 'analysis.full.requested',
      data: { analysisId: analysis.id, siteId, userId },
    })
  } catch (err) {
    console.error('[Inngest] Failed to send analysis event:', err)
    await Promise.all([
      refundCredits(userId, CREDIT_COSTS.fullAnalysis, {
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
