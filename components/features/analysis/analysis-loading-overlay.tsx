'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Crawl du site en cours…', delay: 0 },
  { label: 'Interrogation des moteurs IA…', delay: 20_000 },
  { label: 'Analyse des citations…', delay: 50_000 },
  { label: 'Calcul des scores…', delay: 100_000 },
  { label: "Finalisation de l'analyse…", delay: 160_000 },
] as const

const MAX_SECONDS = 300

type Props = {
  siteName: string | null
}

export function AnalysisLoadingOverlay({ siteName }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timers = STEPS.slice(1).map(({ delay }, i) =>
      setTimeout(() => setStepIndex(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => Math.min(s + 1, MAX_SECONDS)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const pct = Math.min(Math.round((elapsed / MAX_SECONDS) * 100), 99)
  const minutes = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = minutes > 0 ? `${minutes} min ${String(secs).padStart(2, '0')} s` : `${secs} s`
  const remaining = MAX_SECONDS - elapsed
  const remainingMin = Math.ceil(remaining / 60)

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

          {/* Jauge de temps */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">{timeStr}</span>
              <span>
                {remainingMin <= 1
                  ? "Moins d'une minute restante"
                  : `~${remainingMin} min restantes`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <p className="text-right text-xs tabular-nums text-muted-foreground/60">{pct}%</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Restez sur cette fenêtre pour voir vos résultats en temps réel
        </p>
      </div>
    </div>
  )
}
