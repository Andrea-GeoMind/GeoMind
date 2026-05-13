'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { createAnalysis } from '@/lib/db/queries/analyses'
import { canRunFullAnalysis } from '@/lib/quotas'
import { inngest } from '@/lib/inngest/client'

export async function runAnalysisAction(
  siteId: string
): Promise<{ error: string } | { analysisId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  const allowed = await canRunFullAnalysis(user.id)
  if (!allowed) {
    return {
      error:
        "Limite d'analyses atteinte ce mois-ci pour votre plan. Passez au plan supérieur.",
    }
  }

  const analysis = await createAnalysis({ siteId, userId: user.id })

  try {
    await inngest.send({
      name: 'site.analysis.requested',
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
