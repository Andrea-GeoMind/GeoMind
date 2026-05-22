'use client'

import { useEffect } from 'react'
import { Rocket } from 'lucide-react'

export function AnalysisStartedStep() {
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

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

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-indigo-600"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
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
