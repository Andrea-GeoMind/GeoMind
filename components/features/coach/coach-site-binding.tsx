'use client'

import { useEffect } from 'react'
import { useCoach, type CoachBoundSite } from '@/components/features/coach/coach-provider'

/**
 * Enregistre le site courant dans le CoachProvider (§16.5.A) — rendu par le
 * layout du site (`app/(app)/sites/[siteId]/layout.tsx`). Hors d'un site
 * (dashboard, settings), aucun binding : le bouton flottant est masqué.
 */
export function CoachSiteBinding({
  siteId,
  hasAnalysis,
  globalScore,
  technicalScore,
  contentScore,
}: CoachBoundSite) {
  const { bindSite, unbindSite } = useCoach()

  useEffect(() => {
    bindSite({ siteId, hasAnalysis, globalScore, technicalScore, contentScore })
    return () => unbindSite(siteId)
  }, [bindSite, unbindSite, siteId, hasAnalysis, globalScore, technicalScore, contentScore])

  return null
}
