'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { isSiteFrozen } from '@/lib/quotas'
import { CREDIT_COSTS, consumeCredits, refundCredits } from '@/lib/credits'
import { createReputationRun, updateReputationRunStatus } from '@/lib/db/queries/reputation'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'

/**
 * Lance une analyse de réputation (PLAN item 31). Décompte atomique des crédits
 * au lancement, remboursé si échec (ici ou dans le job). Ownership vérifié.
 */
export async function runReputationAction(
  siteId: string
): Promise<{ error: string } | { runId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  if (await isSiteFrozen(user.id, siteId)) {
    return { error: 'Ce site est gelé. Passez à un plan supérieur pour le réactiver.' }
  }

  const consumed = await consumeCredits(user.id, CREDIT_COSTS.reputationCheck, 'analysis', {
    siteId,
    kind: 'reputation',
  })
  if (!consumed.ok) {
    return {
      error: `Crédits insuffisants : l’analyse de réputation coûte ${CREDIT_COSTS.reputationCheck} crédits (solde : ${consumed.balance.total}).`,
    }
  }

  let runId: string
  try {
    runId = await createReputationRun(siteId, user.id)
  } catch {
    await refundCredits(user.id, CREDIT_COSTS.reputationCheck, { siteId, step: 'createRun' })
    return { error: 'Une erreur est survenue. Réessayez.' }
  }

  trackEvent(user.id, 'reputation_started', { siteId, runId })

  try {
    await inngest.send({
      name: 'site.reputation.requested',
      data: { runId, siteId, userId: user.id },
    })
  } catch (err) {
    console.error('[reputation] Inngest send failed:', err)
    await Promise.all([
      refundCredits(user.id, CREDIT_COSTS.reputationCheck, { siteId, runId, step: 'inngest' }),
      updateReputationRunStatus(runId, 'error', 'Échec du lancement.'),
    ])
    return { error: 'Erreur au lancement de l’analyse. Réessayez.' }
  }

  revalidatePath(`/sites/${siteId}/reputation`)
  return { runId }
}
