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
  const { unlockAnalysis } = useAnalysisLock()

  // Notify and unlock on transition — not on first render
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (prev !== null && prev !== status) {
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

  // Poll every 5 s while in progress
  useEffect(() => {
    if (status !== 'pending' && status !== 'running') {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => router.refresh(), 5000)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [status, router])

  return null
}
