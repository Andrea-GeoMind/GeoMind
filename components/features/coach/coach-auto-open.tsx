'use client'

import { useEffect, useRef } from 'react'
import { useCoach } from '@/components/features/coach/coach-provider'
import { markCoachIntroSeenAction } from '@/app/(app)/sites/[siteId]/coach-actions'

interface CoachAutoOpenProps {
  siteId: string
  introSeen: boolean
  analysisSuccess: boolean
}

/**
 * Auto-ouverture unique de GEO (§16.5.D) — à la fin de la première analyse
 * réussie d'un site (et uniquement celle-là), le panel flottant s'ouvre seul.
 * Le flag `sites.coach_intro_seen` garantit qu'on ne récidive jamais.
 */
export function CoachAutoOpen({ siteId, introSeen, analysisSuccess }: CoachAutoOpenProps) {
  const { openPanel } = useCoach()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || introSeen || !analysisSuccess) return
    firedRef.current = true
    openPanel('auto')
    void markCoachIntroSeenAction(siteId)
  }, [siteId, introSeen, analysisSuccess, openPanel])

  return null
}
