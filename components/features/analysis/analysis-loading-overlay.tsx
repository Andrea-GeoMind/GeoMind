'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Crawl du site en cours…', delay: 0 },
  { label: 'Interrogation des moteurs IA…', delay: 20_000 },
  { label: 'Analyse des citations…', delay: 50_000 },
  { label: 'Calcul des scores…', delay: 100_000 },
  { label: 'Finalisation de l\'analyse…', delay: 160_000 },
] as const

type Props = {
  siteName: string | null
}

export function AnalysisLoadingOverlay({ siteName }: Props) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timers = STEPS.slice(1).map(({ delay }, i) =>
      setTimeout(() => setStepIndex(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Analyse en cours"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Analyse en cours
          </h2>
          {siteName && (
            <p className="text-sm text-muted-foreground">{siteName}</p>
          )}
        </div>

        <div className="w-full space-y-4">
          <p className="min-h-[1.25rem] text-sm font-medium text-primary">
            {STEPS[stepIndex].label}
          </p>
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-700',
                  i < stepIndex
                    ? 'w-4 bg-primary/50'
                    : i === stepIndex
                      ? 'w-8 bg-primary'
                      : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Durée estimée : 2 à 5 minutes</p>
          <p className="text-xs text-muted-foreground/50">
            Restez sur cette fenêtre pour voir vos résultats en temps réel
          </p>
        </div>
      </div>
    </div>
  )
}
