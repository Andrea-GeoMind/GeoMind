'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'

type AnalysisStatus = 'pending' | 'running' | 'success' | 'error'

interface OverviewPollingProps {
  status: AnalysisStatus
}

export function OverviewPolling({ status }: OverviewPollingProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevStatusRef = useRef<AnalysisStatus | null>(null)
  const wasPollingRef = useRef(false)
  const { locked, unlockAnalysis } = useAnalysisLock()

  // Quand l'overlay est actif, il est seule source de vérité : il suit la
  // progression via une route légère et déclenche lui-même le refresh + toast
  // de fin. On n'agit ici que dans le cas où l'overlay est absent (ex. onglet
  // rechargé en cours d'analyse), pour éviter le double toast et surtout le
  // router.refresh() en boucle qui fait ramer le navigateur.

  // Notify and unlock on transition — uniquement si c'est ce composant qui poll
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (prev !== null && prev !== status && wasPollingRef.current) {
      if (status === 'success') {
        unlockAnalysis()
        toast({
          title: 'Analyse terminée',
          description: 'Votre score GEO est maintenant disponible.',
        })
      } else if (status === 'error') {
        unlockAnalysis()
        toast({
          title: 'Analyse échouée',
          description: "Une erreur est survenue lors de l'analyse.",
          variant: 'destructive',
        })
      }
    }
  }, [status, unlockAnalysis])

  // Poll every 5 s while in progress — sauf si l'overlay s'en charge déjà
  useEffect(() => {
    if (locked) return
    if (status !== 'pending' && status !== 'running') {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      return
    }
    wasPollingRef.current = true
    timerRef.current = setInterval(() => router.refresh(), 5000)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [status, router, locked])

  return null
}
