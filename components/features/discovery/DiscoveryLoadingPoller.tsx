'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const STEPS = [
  { label: 'Crawl des pages de votre site…', duration: 15000 },
  { label: 'Analyse de votre activité…', duration: 10000 },
  { label: 'Génération des mots-clés…', duration: 8000 },
  { label: 'Création des prompts neutres…', duration: 7000 },
]

const TOTAL_MS = STEPS.reduce((acc, s) => acc + s.duration, 0) // 40 000 ms

export function DiscoveryLoadingPoller() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0) // en secondes

  // Avance les étapes visuelles
  useEffect(() => {
    let i = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    let cumulative = 0
    for (const step of STEPS) {
      const idx = i++
      const t = setTimeout(() => setStepIndex(idx), cumulative)
      timers.push(t)
      cumulative += step.duration
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  // Chronomètre (1 tick/s, plafonné à TOTAL_MS/1000)
  useEffect(() => {
    const maxSeconds = TOTAL_MS / 1000
    const id = setInterval(
      () => setElapsed((s) => Math.min(s + 1, maxSeconds)),
      1000
    )
    return () => clearInterval(id)
  }, [])

  // Polling toutes les 5s — refresh la page serveur pour détecter siteMetadata
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [router])

  const maxSeconds = TOTAL_MS / 1000
  const pct = Math.min(Math.round((elapsed / maxSeconds) * 100), 99)
  const timeStr = elapsed < 60 ? `${elapsed} s` : `${Math.floor(elapsed / 60)} min ${String(elapsed % 60).padStart(2, '0')} s`
  const remaining = Math.max(0, maxSeconds - elapsed)
  const remainingStr = remaining > 0 ? `~${Math.ceil(remaining)} s restantes` : 'Finalisation…'

  return (
    <div className="flex flex-col items-center gap-8 rounded-xl border border-border bg-card px-6 py-14 text-center shadow-sm">
      {/* Spinner animé */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-[--brand-blue-100]" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[--brand-blue-500]" />
        <Loader2 size={28} className="text-[--brand-blue-400] animate-spin" style={{ animationDuration: '2s' }} />
      </div>

      {/* Étape courante */}
      <div className="space-y-2">
        <p className="text-base font-semibold text-foreground">Découverte en cours</p>
        <p className="text-sm text-muted-foreground">{STEPS[stepIndex]?.label}</p>
      </div>

      {/* Jauge de progression */}
      <div className="w-full max-w-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">{timeStr}</span>
          <span className="tabular-nums">{pct}% — {remainingStr}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--brand-blue-100]">
          <div
            className="h-full rounded-full bg-[--brand-blue-500] transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        {/* Marqueurs d'étapes */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i <= stepIndex ? 'bg-[--brand-blue-500]' : 'bg-[--brand-blue-100]'
              }`}
            />
          ))}
        </div>
        <p className="text-left text-xs text-muted-foreground">
          Étape {stepIndex + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  )
}
