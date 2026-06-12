'use client'

import { useCoach } from '@/components/features/coach/coach-provider'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'

interface CoachFloatingButtonProps {
  /** Solde de crédits formaté (badge optionnel) — null pour le masquer */
  creditsBadge?: string | null
}

/**
 * Bouton flottant de GEO (§16.5.A) — coin bas-droit, z-50. Masqué pendant
 * une analyse (overlay bloquant) et hors d'un site (GEO a besoin d'un site).
 */
export function CoachFloatingButton({ creditsBadge = null }: CoachFloatingButtonProps) {
  const { isOpen, openPanel, site } = useCoach()
  const { locked } = useAnalysisLock()

  if (locked || !site || isOpen) return null

  return (
    <button
      type="button"
      onClick={() => openPanel('floating')}
      aria-label="Ouvrir GEO, l'assistant IA"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-border transition-all hover:shadow-xl hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GeoAvatar size="lg" className="transition-transform group-hover:scale-105" />
      {creditsBadge !== null && (
        <span className="hidden pr-2 text-xs font-semibold text-muted-foreground sm:inline">
          {creditsBadge} crédits
        </span>
      )}
    </button>
  )
}
