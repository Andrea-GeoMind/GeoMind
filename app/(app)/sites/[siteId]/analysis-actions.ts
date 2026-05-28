'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { createAnalysis } from '@/lib/db/queries/analyses'
import { canRunFullAnalysis } from '@/lib/quotas'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'

export async function runAnalysisAction(
  siteId: string
): Promise<{ error: string } | { analysisId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let site, allowed, analysis
  try {
    site = await getSiteById(siteId)
    if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

    allowed = await canRunFullAnalysis(user.id)
    if (!allowed) {
      return {
        error:
          "Limite d'analyses atteinte ce mois-ci pour votre plan. Passez au plan supérieur.",
      }
    }

    analysis = await createAnalysis({ siteId, userId: user.id })
  } catch (err) {
    console.error('[runAnalysisAction] DB error:', err)
    return { error: "Une erreur est survenue. Veuillez réessayer." }
  }

  trackEvent(user.id, 'analysis_started', { siteId, analysisId: analysis.id })

  try {
    await inngest.send({
      name: 'analysis.full.requested',
      data: { analysisId: analysis.id, siteId, userId: user.id },
    })
  } catch (err) {
    console.error('[Inngest] Failed to send analysis event:', err)
    return {
      error: "Une erreur est survenue lors du lancement de l'analyse. Veuillez réessayer.",
    }
  }

  return { analysisId: analysis.id }
}
