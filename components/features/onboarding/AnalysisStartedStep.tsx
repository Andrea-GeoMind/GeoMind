'use client'

import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'

const MAX_SECONDS = 300

const PHASES = [
  { label: 'Connexion aux moteurs IA…', threshold: 0 },
  { label: 'Interrogation ChatGPT…', threshold: 0.1 },
  { label: 'Interrogation Perplexity…', threshold: 0.28 },
  { label: 'Interrogation Gemini…', threshold: 0.46 },
  { label: 'Interrogation Claude…', threshold: 0.64 },
  { label: 'Analyse des citations…', threshold: 0.82 },
  { label: 'Calcul des scores GEO…', threshold: 0.94 },
]

function getCurrentPhase(ratio: number) {
  let phase = PHASES[0]
  for (const p of PHASES) {
    if (ratio >= p.threshold) phase = p
  }
  return phase
}

export function AnalysisStartedStep() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => Math.min(s + 1, MAX_SECONDS)), 1000)
    return () => clearInterval(id)
  }, [])

  const ratio = elapsed / MAX_SECONDS
  const pct = Math.min(Math.round(ratio * 100), 99) // cap à 99 tant que pas terminé
  const phase = getCurrentPhase(ratio)
  const minutes = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr =
    minutes > 0 ? `${minutes} min ${String(secs).padStart(2, '0')} s` : `${secs} s`
  const remaining = MAX_SECONDS - elapsed
  const remainingMin = Math.ceil(remaining / 60)

  return (
    <div className="flex flex-col items-center gap-7 text-center">
      {/* Animated icon */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Rocket className="h-10 w-10 text-indigo-600" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Analyse en cours !</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          GEOMIND interroge ChatGPT, Perplexity, Gemini et Claude en ce moment.
          <br />
          Résultats disponibles dans 2 à 5 minutes.
        </p>
      </div>

      {/* Progress gauge */}
      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-indigo-600">{phase.label}</span>
          <span className="tabular-nums text-muted-foreground">{timeStr}</span>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {pct}% —{' '}
          {remainingMin <= 1
            ? "Moins d’une minute restante"
            : `Environ ${remainingMin} min restantes`}
        </div>
      </div>

      {/* Warning — do not close */}
      <div className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="shrink-0 text-base">⚠️</span>
        <span>
          Chargement en attente — veuillez ne pas fermer cet onglet.
          <br />
          Recharger la page annulera l&apos;analyse.
        </span>
      </div>
    </div>
  )
}
