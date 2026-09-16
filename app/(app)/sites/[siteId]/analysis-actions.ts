'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_COSTS, getUserCredits } from '@/lib/credits'
import { launchFullAnalysis } from '@/lib/analysis/launch'

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

  return launchFullAnalysis(user.id, siteId)
}
